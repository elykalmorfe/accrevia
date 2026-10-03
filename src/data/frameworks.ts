import { Framework, FrameworkCategory } from '../types/evidence';

export const frameworks: Framework[] = [
{
  id: 'ia',
  name: 'Institutional Accreditation',
  shortName: 'IA',
  category: 'Accreditation',
  body: 'AACCUP Institutional Accreditation Survey Instrument',
  description:
  'Evaluates the university as a whole across governance, faculty, instruction, research, extension, and support services.',
  active: true,
  documentCount: 412,
  lastUpdated: '2026-09-22'
},
{
  id: 'pa',
  name: 'Program Accreditation',
  shortName: 'PA',
  category: 'Accreditation',
  body: 'AACCUP Program Accreditation, Levels I–IV',
  description: 'Evaluates individual degree programs against area-based standards of program quality.',
  active: true,
  documentCount: 386,
  lastUpdated: '2026-09-18'
},
{
  id: 'copc',
  name: 'Certificate of Program Compliance',
  shortName: 'COPC',
  category: 'Compliance',
  body: 'CHED Policies, Standards and Guidelines',
  description: 'Verifies that degree programs meet the minimum CHED requirements to be offered.',
  active: true,
  documentCount: 178,
  lastUpdated: '2026-09-09'
},
{
  id: 'pqa',
  name: 'Philippine Quality Award',
  shortName: 'PQA',
  category: 'Quality Excellence',
  body: 'PQA Performance Excellence Framework',
  description: 'Recognizes organizational performance excellence in leadership, strategy, operations, and results.',
  active: true,
  documentCount: 104,
  lastUpdated: '2026-08-04'
},
{
  id: 'iso',
  name: 'ISO 9001:2015 Quality Management System',
  shortName: 'ISO',
  category: 'Quality Management',
  body: 'ISO 9001:2015 Requirements',
  description: 'Certified quality management system covering core and support processes of the university.',
  active: true,
  documentCount: 168,
  lastUpdated: '2026-09-24'
}];


export const frameworkCategories: {category: FrameworkCategory;description: string;}[] = [
{ category: 'Accreditation', description: 'Peer-review evaluation of the institution and its programs.' },
{ category: 'Compliance', description: 'Government regulatory compliance for program offerings.' },
{ category: 'Quality Excellence', description: 'National recognition of organizational performance excellence.' },
{ category: 'Quality Management', description: 'Certified quality management system standards.' }];