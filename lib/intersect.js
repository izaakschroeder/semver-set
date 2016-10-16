
var semver = require('semver');
var product = require('cartesian-product');
var invariant = require('invariant');

var lowest = { semver: -Infinity, operator: '>' };
var highest = { semver: Infinity, operator: '<' };

function cmp(a, b) {
	if (a === '<' && b === '<=') {
		return -1;
	} else if (a === '<=' && b === '<') {
		return 1;
	} else if (a === '>' && b === '>=') {
		return 1;
	} else if (a === '>=' && b === '>') {
		return -1;
	} else {
		return 0;
	}
}

function icmp(a, b) {
	if (a === Infinity) {
		return 1;
	} else if (b === Infinity) {
		return -1;
	} else if (a === -Infinity) {
		return -1;
	} else if (b === -Infinity) {
		return 1;
	} else {
		return 0;
	}
}

function rcmp(a, b) {
	return icmp(a.semver, b.semver) ||
		semver.compare(a.semver, b.semver) ||
		cmp(a.operator, b.operator);
}

function min(a, b) {
	return rcmp(a, b) < 0 ? a : b;
}

function max(a, b) {
	return rcmp(a, b) > 0 ? a : b;
}

function isHi(entry) {
	return /^<?=?$/.test(entry.operator);
}

function isLo(entry) {
	return /^>?=?$/.test(entry.operator);
}

function combine(set, a) {

	var hi = set[1],
		lo = set[0];

	invariant(isLo(lo), 'lo entry must be a lower bound');
	invariant(isHi(hi), 'hi entry must be an upper bound');

	if (isHi(a)) {
		hi = min(a, hi);
	}

	if (isLo(a)) {
		lo = max(a, lo);
	}

	return [lo, hi];
}

function intersect() {
	ranges = Array.prototype.map.call(arguments, semver.Range);
	// item.set is an array of disjunctions – we can match any of the entries
	// this means we must take the cartesian product of all the disjunctions,
	// intersect them with each other, and take the disjunction of the result
	// naturally any empty results can simply be omitted.

	ranges = product(pluck(ranges, 'set'))
		.map(function(values) {
			return flatten(values).reduce(combine, [ lowest, highest ]);
		})
		.filter(function(entry) {
			var lo = entry[0], hi = entry[1];
			return lo.test(hi.semver) && hi.test(lo.semver);
		});

	ranges = ranges.map(function(range) {
		var lo = range[0], hi = range[1];
		if (lo.operator === '>=' && hi.operator === '<') {
			if (/\.0\.0$/.test(hi.semver.raw)) {
				return '^' + lo.semver.raw;
			} else if (/\.0$/.test(hi.semver.raw)) {
				// Anything in the 0.x.x line behaves like ~ even for the ^
				// operator.
				if (/^0\./.test(lo.semver.raw)) {
					return '^' + lo.semver.raw;
				} else {
					return '~' + lo.semver.raw;
				}
			}
		}
		return lo.operator+lo.semver.raw + ' && ' + hi.operator+hi.semver.raw;
	});

	if (ranges.length === 0) {
		return null;
	}

	return ranges.join(' || ');
}

module.exports = intersect;

function pluck (array, prop) {
	return array.map(function(obj) { return obj[prop] })
}
function flatten (array) {
	return array.reduce(function(a,b) { return a.concat(b) }, [])
}
