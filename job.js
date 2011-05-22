////////////////////////////////////////////////////////////////////////////////
// jOrder Benchmark
// Simple JS code benchmarking framework
// Requires jQuery
////////////////////////////////////////////////////////////////////////////////
/*global jQuery */

var jOB = function ($) {
	var benchmarks = [],	// all benchmarks
			self;

	// processes a row
	function process(row, handler) {
		if (typeof row === 'string') {
			return handler('string', row);
		}
		
		var result = [],
				field;
		for (field in row) {
			if (row.hasOwnProperty(field)) {
				result.push(handler(field, row[field]));
			}
		}
		return result.join('');
	}

	// 'process' handler for data cell
	function cellHandler(field, value) {
		return '<td>' + value + '</td>';
	}

	// adding toolbar
	$(function () {
		$(['<label for="job-count">Test cycles: </label>',
			'<select id="job-count">',
			'<option value="1">1</option>',
			'<option value="10" selected="selected">10</option>',
			'<option value="100">100</option>',
			'<option value="1000">1000</option>',
			'</select>',
			'<label for="job-timeout">Timeout: </label>',
			'<select id="job-timeout">',
			'<option value="1000" selected="selected">1 sec</option>',
			'<option value="5000">5 secs</option>',
			'</select>',
			'<input id="job-estimate" type="checkbox" checked="checked" />',
			'<label for="job-estimate">Estimate on timeout</label>',
			'</div>'
		].join(''))
			.appendTo($('#job-toolbar'));
			
		// adding toolbar events
		$('#job-count').change(function () {
			self.count = $(this).val();
		});
		$('#job-timeout').change(function () {
			self.timeout = $(this).val();
		});
		$('#job-estimate').click(function () {
			self.estimate = $(this).is(':checked');
		});
		
		self.start();
	});
	
	self = {
		// properties
		count: 10,				// number of times to run at once
		timeout: 1000,		// test timeout in ms
		estimate: true,		// whether to project timed out test durations
		
		// registers a benchmark
		benchmark: function (desc) {
			benchmarks.push({desc: desc, tests: []});
		},
		
		// runs a test and measures time
		// - message to be displayed for test
		// - handlers: test to run 'count' times
		//	 expected to return a json table
		// - options
		test: function (message /*, handlers..., options */) {
			var benchmark = benchmarks[benchmarks.length - 1],
					candidates = [],
					options,
					i, arg;
			if (benchmark) {
				// collecting 
				for (i = 1; i < arguments.length; i++) {
					arg = arguments[i];
					switch (typeof arg) {
					case 'function':
						candidates.push(arg);
						break;
					case 'object':
						options = arg;
						break;
					default:
						throw "Invalid argument passed to jOB.test()";
					}
				}
				benchmark.tests.push({message: message, handlers: candidates, options: options});
			}
		},

		// builds a table with result data
		build: function (json) {
			$('#job-results')
				.empty()
				.append([
					'<colgroup>',			
					process(json[0], function (field, value) {
						return '<col class="' + field + '"></col>';
					}),
					'</colgroup>',
					'<thead>',
					'<tr>',
					process(json[0], function (field, value) {
						return '<th>' + field + '</th>';
					}),				
					'</tr>',
					'</thead>',
					'<tbody>',
					function () {
						var result = [],
								i;
						for (i = 0; i < json.length; i++) {
							result.push('<tr>' + process(json[i], cellHandler) + '</tr>');
						}
						return result.join('');
					}(),
					'</tbody>'
				].join(''));
		},

		// builds a table containing 		
		start: function () {
			$('#job-benchmarks').append(function () {
				var result = [],
						j, benchmark,
						i, test;
				for (j = 0; j < benchmarks.length; j++) {
					benchmark = benchmarks[j];
					// benchmark header
					result.push([
						'<h3>', benchmark.desc, '</h3>',
						'<table>',
						'<tbody>'						
					].join(''));
					// tests
					for (i = 0; i < benchmark.tests.length; i++) {
						test = benchmark.tests[i];
						result.push([
							'<tr id="job-', j, '-', i, '">',
							'<td class="job-desc">', test.message, '</td>',
							'<td class="job-button"><input class="job-run" type="button" value="&#8594;" /></td>',
							// adding result cells for each candidate
							(function () {
								var result = [],
										handlers = test.handlers,
										k;
								for (k = 0; k < handlers.length; k++) {
									result.push('<td id="job-' + [j, i, k].join('-') + '" class="job-result"></td>');
								}
								return result.join('');
							}()),
							'<td class="job-arrow"></td>',
							'</tr>'
						].join(''));
					}
					result.push([
						'</tbody>',
						'</table>'
					].join(''));
				}
				return result.join('');
			}());
		}
	};
	
	function run(b, t, c) {
		var result,
				test = benchmarks[b].tests[t],
				start = new Date(), end,
				i,
				$target,
				$tr = $(['#job', b, t].join('-')),
				unit = 'ms';
		
		// running test function
		for (i = 0; i < self.count; i++) {
			result = test.handlers[c]();
			if (self.timeout < new Date() - start) {
				break;
			}
		}
		end = new Date();
		
		// removing all arrows
		$('td.job-arrow')
			.empty();
		$target = $(['#job', b, t, c].join('-'));

		// handling timeout
		if (i < self.count) {
			// adding timeout value (% or estimation)
			$target.text(self.estimate ?
				String(Math.floor(self.timeout * self.count / i)) + unit :
				"timeout (" + Math.floor(100 * i / self.count) + "%)");

			// hiding result table
			$('#job-results')
				.hide();
			return;
		} else {
			// adding duration
			$target.text(String(end - start) + unit);
			
			// displaying arrow
			$tr.find('.job-arrow')
				.html('<span>&#8594;</span>')
			.end();
				
			// building result table
			self.build(test.options && test.options.lengthonly ? [{ length: result.length }] : result);
		}
	}
	
	// events
	$('input.job-run').live('click', function () {
		var $this = $(this),
				$tr = $this.closest('tr'),
				$tbody = $this.closest('tbody'),
				id = $tr.attr('id').split('-'),
				test = benchmarks[id[1]].tests[id[2]],
				i;
		for (i = 0; i < test.handlers.length; i++) {
			run(id[1], id[2], i);
		}

		// aligning result table to benchmark header
		$('#job-results')
			.css('top', $tbody.offset().top);		
	});
	
	return self;
}(jQuery);

