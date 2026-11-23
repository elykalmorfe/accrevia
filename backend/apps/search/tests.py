from unittest.mock import patch

from django.test import SimpleTestCase

from apps.search.services.rerank import rerank
from apps.search.services.scoring import accreditation_boost, evidence_priority, metadata_priority, normalized_phrase, parse_intent


class SearchRankingTests(SimpleTestCase):
    @patch("apps.search.services.rerank._cross_encoder")
    def test_exact_certificate_title_ranks_ahead_of_summary(self, encoder):
        query = "AACCUP Candidate Certificate - Bachelor of Physical Education"
        certificate = {"title": "AACCUP Candidate Certificate – Bachelor of Physical Education"}
        summary = {"title": "AACCUP Program Status — Tandag Campus"}
        phrase = normalized_phrase(query)
        priority = metadata_priority(certificate, phrase)
        candidates = [
            {"payload": certificate, "score": priority + 0.1, "match_priority": priority},
            {"payload": summary, "score": 0.5, "match_priority": metadata_priority(summary, phrase)},
        ]
        encoder.return_value.predict.return_value = [-4.0, 8.0]

        ranked = rerank(query, candidates, top_k=2)

        self.assertEqual(ranked[0]["payload"], certificate)
        self.assertEqual(ranked[0]["rerank_score"], -4.0)

    @patch("apps.search.services.rerank._cross_encoder")
    def test_reranking_keeps_accreditation_relevance(self, encoder):
        intent = parse_intent("ISO criterion 1")
        candidates = []
        for criterion in ("c-iso-1", "c-iso-10"):
            payload = {"framework_id": "iso", "criterion_id": criterion}
            score = accreditation_boost(payload, intent, 0.4)
            candidates.append({"payload": payload, "score": score / (1 + score)})
        encoder.return_value.predict.return_value = [2.0, 2.0]

        ranked = rerank("ISO criterion 1", candidates, top_k=2)

        self.assertGreater(ranked[0]["score"], ranked[1]["score"])
        self.assertEqual(ranked[0]["payload"]["criterion_id"], "c-iso-1")

    @patch("apps.search.services.rerank._cross_encoder")
    def test_reranking_considers_a_second_document_before_extra_passages(self, encoder):
        summary = {"payload": {"document_id": "summary"}, "score": 0.5}
        certificate = {"payload": {"document_id": "certificate"}, "score": 0.2}
        encoder.return_value.predict.return_value = [-3.0, 6.0]

        ranked = rerank("accreditation certificate", [summary.copy() for _ in range(3)] + [certificate], top_k=1)

        self.assertEqual(ranked[0]["payload"]["document_id"], "certificate")

    @patch("apps.search.services.rerank._cross_encoder")
    def test_exact_ocr_passage_survives_a_weak_model_score(self, encoder):
        query = "external validation completed in July"
        phrase = normalized_phrase(query)
        payload = {"text": "The external validation completed in July, followed by the review."}
        variant = {"text": "The external validation, completed in July."}
        priority = evidence_priority(payload, phrase, query)
        variant_priority = evidence_priority(variant, phrase, query)
        match = {"payload": payload, "match_priority": priority, "score": priority + 0.2}
        related = {"payload": variant, "match_priority": variant_priority, "score": variant_priority + 0.5}
        other = {"payload": {"text": "Annual faculty report"}, "score": 0.5}
        encoder.return_value.predict.return_value = [-10.0, 9.0, -11.0]

        ranked = rerank(query, [match, related, other], top_k=2)

        self.assertEqual([candidate["payload"] for candidate in ranked], [payload, variant])

    @patch("apps.search.services.rerank._cross_encoder")
    def test_unrelated_candidates_are_omitted(self, encoder):
        encoder.return_value.predict.return_value = [-11.0]

        ranked = rerank("unrelated topic", [{"text": "Annual faculty report", "score": 0.5}], top_k=1)

        self.assertEqual(ranked, [])
