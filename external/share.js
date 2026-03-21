// Canopy Share FFI — Web Share API bindings
//
// Imported in Share.can via:
//   foreign import javascript "external/share.js" as ShareFFI


// ============================================================================
// TYPE CONSTRUCTORS
// ============================================================================

var _Share_shared = __canopy_debug ? { $: 'Shared' } : { $: 0 };

var _Share_cancelled = __canopy_debug ? { $: 'Cancelled' } : { $: 1 };

function _Share_failed(error)
{
	return __canopy_debug ? { $: 'Failed', a: error } : { $: 2, a: error };
}

var _Share_notAllowedError = __canopy_debug ? { $: 'NotAllowedError' } : { $: 0 };

var _Share_notSupportedError = __canopy_debug ? { $: 'NotSupportedError' } : { $: 1 };

function _Share_dataError(msg)
{
	return __canopy_debug ? { $: 'DataError', a: msg } : { $: 2, a: msg };
}

var _Share_abortError = __canopy_debug ? { $: 'AbortError' } : { $: 3 };

function _Share_unknownError(msg)
{
	return __canopy_debug ? { $: 'UnknownError', a: msg } : { $: 4, a: msg };
}


// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build a share data object from Maybe fields.
 */
function _Share_buildShareData(data)
{
	var result = {};
	var title = data.title;
	var text = data.text;
	var url = data.url;

	if (title.$ === 'Just' || title.$ === 0)
	{
		result.title = title.a;
	}
	if (text.$ === 'Just' || text.$ === 0)
	{
		result.text = text.a;
	}
	if (url.$ === 'Just' || url.$ === 0)
	{
		result.url = url.a;
	}
	return result;
}

/**
 * Map a DOMException to a ShareError.
 */
function _Share_mapError(err)
{
	if (err && err.name === 'NotAllowedError')
	{
		return _Share_notAllowedError;
	}
	if (err && err.name === 'TypeError')
	{
		return _Share_dataError(err.message || 'Invalid share data');
	}
	if (err && err.name === 'AbortError')
	{
		return _Share_abortError;
	}
	if (err && err.name === 'NotSupportedError')
	{
		return _Share_notSupportedError;
	}
	return _Share_unknownError(err ? (err.message || String(err)) : 'Unknown error');
}

/**
 * Execute a share call and invoke callback with result.
 */
function _Share_doShare(shareObj, callback)
{
	if (typeof navigator === 'undefined' || typeof navigator.share !== 'function')
	{
		callback(_Scheduler_succeed(_Share_failed(_Share_notSupportedError)));
		return;
	}
	try
	{
		navigator.share(shareObj).then(function()
		{
			callback(_Scheduler_succeed(_Share_shared));
		}).catch(function(err)
		{
			if (err && err.name === 'AbortError')
			{
				callback(_Scheduler_succeed(_Share_cancelled));
			}
			else
			{
				callback(_Scheduler_succeed(_Share_failed(_Share_mapError(err))));
			}
		});
	}
	catch(e)
	{
		callback(_Scheduler_succeed(_Share_failed(_Share_mapError(e))));
	}
}


// ============================================================================
// SHARE OPERATIONS (Tasks)
// ============================================================================

/**
 * Share text/URL data via navigator.share().
 * @canopy-type { title : Maybe String, text : Maybe String, url : Maybe String } -> Task Never ShareResult
 * @name shareData
 */
function shareData(data)
{
	return _Scheduler_binding(function(callback)
	{
		_Share_doShare(_Share_buildShareData(data), callback);
	});
}

/**
 * Convert a Canopy List of File to a JS array.
 * File.File is an opaque wrapper around a native JS File object.
 * In Canopy's runtime, `type File = File` wraps the value in { $: 'File', a: jsFile }
 * or { $: 0, a: jsFile } in prod. We extract the underlying JS File.
 * @canopy-type List a -> Task Never ()
 * @name filesToValue
 */
function filesToValue(fileList)
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
}

/**
 * Share data with files. Takes the share data record and a Json.Decode.Value
 * containing the files array.
 * @canopy-type { title : Maybe String, text : Maybe String, url : Maybe String } -> Json.Decode.Value -> Task Never ShareResult
 * @name shareDataWithFiles
 */
var shareDataWithFiles = F2(function(data, filesValue)
{
	return _Scheduler_binding(function(callback)
	{
		var shareObj = _Share_buildShareData(data);
		// filesValue is a raw JS array of File objects
		shareObj.files = filesValue;
		_Share_doShare(shareObj, callback);
	});
});

/**
 * Encode a list of File.File to a Json.Decode.Value (JS array).
 * File.File is a kernel type wrapping a native JS File.
 * @canopy-type List a -> Json.Decode.Value
 * @name encodeFileList
 */
function encodeFileList(fileList)
{
	var wrapped = _List_toArray(fileList);
	var native = [];
	for (var i = 0; i < wrapped.length; i++)
	{
		native.push(wrapped[i].a);
	}
	return native;
}


// ============================================================================
// FEATURE DETECTION (Tasks)
// ============================================================================

/**
 * Check if navigator.share is available.
 * @canopy-type Task Never Bool
 * @name getIsSupported
 */
var getIsSupported = _Scheduler_binding(function(callback)
{
	var supported = typeof navigator !== 'undefined'
		&& typeof navigator.share === 'function';
	callback(_Scheduler_succeed(supported));
});

/**
 * Get detailed share support info.
 * @canopy-type Task Never { textAndUrl : Bool, files : Bool }
 * @name getSupport
 */
var getSupport = _Scheduler_binding(function(callback)
{
	var hasShare = typeof navigator !== 'undefined'
		&& typeof navigator.share === 'function';
	var hasCanShare = typeof navigator !== 'undefined'
		&& typeof navigator.canShare === 'function';
	var filesSupported = false;
	if (hasCanShare)
	{
		try
		{
			filesSupported = navigator.canShare({
				files: [new File([''], 'test.txt', { type: 'text/plain' })]
			});
		}
		catch(e)
		{
			filesSupported = false;
		}
	}
	callback(_Scheduler_succeed({ textAndUrl: hasShare, files: filesSupported }));
});

/**
 * Check if specific share data can be shared.
 * @canopy-type { title : Maybe String, text : Maybe String, url : Maybe String } -> Task Never Bool
 * @name canShareData
 */
function canShareData(data)
{
	return _Scheduler_binding(function(callback)
	{
		if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function')
		{
			var hasShare = typeof navigator !== 'undefined'
				&& typeof navigator.share === 'function';
			callback(_Scheduler_succeed(hasShare));
			return;
		}
		var shareObj = _Share_buildShareData(data);
		try
		{
			callback(_Scheduler_succeed(navigator.canShare(shareObj)));
		}
		catch(e)
		{
			callback(_Scheduler_succeed(false));
		}
	});
}

/**
 * Check if files can be shared.
 * @canopy-type Task Never Bool
 * @name canShareFilesCheck
 */
var canShareFilesCheck = _Scheduler_binding(function(callback)
{
	if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function')
	{
		callback(_Scheduler_succeed(false));
		return;
	}
	try
	{
		var result = navigator.canShare({
			files: [new File([''], 'test.txt', { type: 'text/plain' })]
		});
		callback(_Scheduler_succeed(result));
	}
	catch(e)
	{
		callback(_Scheduler_succeed(false));
	}
});

/**
 * Check if the Web Share API is available.
 *
 * @canopy-type () -> Task Never Capability.Available
 * @name isAvailable
 */
var isAvailable = function(_unit) {
	return _Scheduler_binding(function(callback) {
		try {
			if (typeof navigator !== 'undefined' && navigator.share) {
				callback(_Scheduler_succeed({ $: 'Supported' }));
			} else {
				callback(_Scheduler_succeed({ $: 'Unsupported' }));
			}
		} catch (e) {
			callback(_Scheduler_succeed({ $: 'Unsupported' }));
		}
	});
};
