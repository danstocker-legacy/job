jOB
===

jOB is a simple benchmarking framework for JavaScript.

Requirements
------------

- jQuery

Initialization
--------------

The benchmark page is constructed according to the information specified through the `benchmark` and `test` methods of the `jOB` object, when the document ready event fires.

Usage
-----

### benchmark(description, labels...)

Registers a new benchmark. Each benchmark may run multiple tests on multiple candidates. Candidates are identified by their labels.

Example:

	jOB.benchmark("awesome speed improvement", "Old code", "My algorithm");

### test(description, handler..., options)

Registers a benchmark test. The `handler` arguments specify the functions to be run for the candidates.

- `description`: Textual description of the test
- `handler`: Test function that will be called by the framework. May take one argument, an integer call counter. Expected to return an array of objects. The return value or its length will be displayed on the benchmark page upon manual execution.
- `options`:
	- `lengthonly`: When set to true, only the length of the handler's return value will be displayed
	- `before`: Function to be run once before the test

Example:

	jOB.test("DOM population", function (i) {
		/*...*/
	}, function (i) {
		/*...*/
	}, {lengthonly: true, before: function () {/*...*/}});

