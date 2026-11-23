const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, {compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true
  }}).outputText, filename);
};

const {repositoryChildren, matchesRepositoryCampus, repositoryDescendantIds, uploadedFrameworkRecords, resolveUploadFolderPath} = require('../src/utils/repositoryView.ts');
const {reconcilePaCopcRepository} = require('../src/utils/programAccreditation.ts');

for (const frameworkId of ['ia', 'pa', 'copc', 'pqa', 'iso']) {
  const root = {id: `folder-${frameworkId}`, frameworkId, code: frameworkId.toUpperCase(), isSystem: true};
  const source = {id: `${frameworkId}-source`, frameworkId, name: 'Original folder', code: 'SRC', campusId: 'cantilan'};
  const nested = {id: `${frameworkId}-nested`, frameworkId, parentId: source.id, name: 'Nested folder', code: 'NEST'};
  const otherCampus = {...source, id: `${frameworkId}-tandag`, campusId: 'tandag'};
  const document = {id: `${frameworkId}-file`, frameworkId, folderId: nested.id, title: 'Original file', keywords: []};
  const folders = [root, source, nested, otherCampus];
  assert.deepEqual(repositoryChildren(root, folders, 'cantilan').map(f => f.id), [source.id]);
  assert.deepEqual(repositoryChildren(source, folders, 'cantilan').map(f => f.id), [nested.id]);
  assert(matchesRepositoryCampus(document, 'cantilan', folders));
  assert(!matchesRepositoryCampus(document, 'tandag', folders));
  assert(repositoryDescendantIds(source.id, folders).has(document.folderId));
  const saved = reconcilePaCopcRepository(folders, [document]);
  assert(saved.folders.some(f => f.id === source.id));
  assert(saved.folders.some(f => f.id === nested.id));
  assert.equal(saved.documents[0].folderId, nested.id);
  assert.deepEqual(saved.documents[0], document);
  const libraryFolder = {...source, libraryOnly: true};
  const uploadFile = {...document, libraryOnly: true};
  const shared = uploadedFrameworkRecords(frameworkId, 'cantilan', [root, libraryFolder, nested, otherCampus], [uploadFile]);
  assert.equal(shared.folders[0], libraryFolder);
  assert(shared.folders.includes(nested));
  assert.equal(shared.documents[0], uploadFile); // No copied record or changed original-file ID.
  assert.equal(uploadedFrameworkRecords(frameworkId, 'tandag', [libraryFolder, nested], [uploadFile]).documents.length, 0);
  const created = [];
  let nextId = 0;
  const create = (name, parentId) => ({id: `${frameworkId}-batch-${nextId++}`, name, parentId, frameworkId, campusId: 'cantilan', libraryOnly: true});
  const first = resolveUploadFolderPath('Manuals/Policies/first.pdf', source.id, created, create);
  created.push(...first.created);
  const second = resolveUploadFolderPath('Manuals/Policies/second.pdf', source.id, created, create);
  assert.equal(second.created.length, 0);
  assert.equal(second.folderId, created[1].id);
  assert.equal(created[0].name, 'Manuals');
  assert.equal(created[1].parentId, created[0].id);
  const uploads = uploadedFrameworkRecords(frameworkId, 'cantilan', created, [{...uploadFile, folderId: second.folderId}]);
  assert.equal(uploads.documents.length, 1);
  const canonicalUpload = uploadedFrameworkRecords(frameworkId, 'cantilan', folders, [uploadFile, {...document, id: 'native-file'}]);
  assert(canonicalUpload.folders.includes(source));
  assert(canonicalUpload.folders.includes(nested));
  assert.equal(canonicalUpload.documents.length, 1);
  // New source folders appear on the next render; source renames stay in place.
  const added = {...source, id: `${frameworkId}-added`, name: 'Added in feature'};
  assert(repositoryChildren(root, [...folders, added], 'cantilan').some(f => f.id === added.id));
  assert.equal(repositoryChildren(root, folders.map(f => f.id === source.id ? {...f, name: 'Renamed'} : f), 'cantilan')[0].name, 'Renamed');
  assert(repositoryChildren(root, folders, 'cantilan', [source.id]).some(f => f.id === source.id));
  assert(!repositoryChildren(root, [root, {...source, libraryOnly:true}], 'cantilan', [source.id]).some(f => f.id === source.id));
  assert(repositoryChildren(root, folders.filter(f => f.id !== source.id), 'cantilan').some(f => f.id === nested.id) === false);
}

const root = {id: 'folder-iso', frameworkId: 'iso', code: 'ISO'};
const orphan = {id: 'orphan', frameworkId: 'iso', parentId: 'missing', campusId: 'cantilan'};
assert(repositoryChildren(root, [root, orphan], 'cantilan').includes(orphan));
assert(matchesRepositoryCampus({campus: 'University-wide'}, 'bislig', []));
assert(matchesRepositoryCampus({campus: 'San Miguel Campus'}, 'san-miguel', []));
assert(!matchesRepositoryCampus({campusId: 'lianga', campus: 'Tandag'}, 'tandag', []));
assert(matchesRepositoryCampus({campusId: 'lianga'}, 'all', []));
const renamedDefault = {id: 'folder-copc-certificate', frameworkId: 'copc', name: 'Renamed certificate folder', code: 'CUSTOM'};
const preserved = reconcilePaCopcRepository([renamedDefault], [{id: 'pending-folder', frameworkId: 'copc', folderId: 'source-loading'}]);
assert.equal(preserved.folders.find(f => f.id === renamedDefault.id).name, renamedDefault.name);
assert.equal(preserved.documents[0].folderId, 'source-loading');
console.log('Repository sync passed: all five frameworks, campus isolation, source hierarchy, additions, renames, and preserved document references.');
