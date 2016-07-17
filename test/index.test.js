var fs = require('fs');
var nock = require('nock');
var test = require('tape');
var huracan = require('../lib/index');

var fixtures = {
  advisory: fs.readFileSync(__dirname + '/fixtures/062034.shtml').toString(),
  feed: fs.readFileSync(__dirname + '/fixtures/gis-ep.xml')
};

var noaa = nock('http://www.nhc.noaa.gov')
  .get('/gis-ep.xml')
  .reply(200, fixtures.feed)
  .get(/text\/refresh\/MIATCPEP3/)
  .reply(200, fixtures.advisory);

test('advisory', function (t) {
  var info = huracan.advisory(fixtures.advisory);
  t.deepEqual(info.location, [15.2, -124.7], 'scrapes location');
  t.end();
});

test('fetch', function (t) {
  t.plan(2);
  var want = { location: [15.2, -124.7] };
  huracan.fetch(function (err, info) {
    t.error(err, 'with no errors');
    t.deepEqual(info, want, 'finds the hurricane');
  });
});

test('summary', function (t) {
  var link = huracan.summary(fixtures.feed);
  t.true(link.match('nhc.noaa.gov'), 'finds a link to the summary');
  t.end();
});

test('toGeoJSON', function (t) {
  var info = huracan.advisory(fixtures.advisory);
  var fcol = huracan.toGeoJSON(info);
  t.equal(fcol.type, 'FeatureCollection', 'builds FeatureCollection');
  t.equal(fcol.features.length, 1, 'holding a features array');
  var feat = fcol.features[0];
  t.equal(feat.type, 'Feature', 'there is one Feature');
  t.equal(feat.geometry.type, 'Point', 'hurricane as Point');
  var loc = [-124.7, 15.2];
  t.deepEqual(feat.geometry.coordinates, loc, 'and its location');
  t.end();
});
