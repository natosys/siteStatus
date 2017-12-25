//var _FILEPATH = "file:///Users/nathanmills/Code/siteStatus2/variables.txt";
/* Set global static variables
 * Change these files to match site and spacecraft alignment
 */
//var _WSOCFILEPATH = "https://intelshare.intelink.gov/sites/53sigbn/Staff/S3/OPS/Shared%20Documents/siteStatus3/wsocs.txt";
var _WSOCFILEPATH = "http://sitestatus3.try/wsocs.txt";
//var _SPACECRAFTFILEPATH = "https://intelshare.intelink.gov/sites/53sigbn/Staff/S3/OPS/Shared%20Documents/siteStatus3/spacecraft.txt";
var _SPACECRAFTFILEPATH = "http://sitestatus3.try/spacecraft.txt";
var _SUBSYSTEMFILEPATH = "http://sitestatus3.try/subsystems.txt";
let _WSOCS = readTextFile(_WSOCFILEPATH);
let _SPACECRAFT = readTextFile(_SPACECRAFTFILEPATH);
let _SUBSYSTEMS = readTextFile(_SUBSYSTEMFILEPATH);

/* readTextFile
 * Open the JSON file at the _FILEPATH global variable and read in.
 * This file holds the JSON definition for site settings (WSOCS and RMCE nodes).
 */
function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
	var allText;
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
        if(rawFile.readyState === 4) {
            if(rawFile.status === 200 || rawFile.status == 0) {
                allText = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
	return JSON.parse(allText);
}

/* buildRemoteSiteStatusRow
 * Appends the RMCE nodes (as defined in the variables JSON definition) to the 
 * Architecture Capability Matrix on the home page.
 */
function buildRemoteSiteStatusRow(row, elementType, value, color) {
	console.log("buildRemoteSiteStatusRow");
	var tr = document.getElementById(row);
	for (var i = 0; i < _WSOCS.length; i++) {
		for (var j = 0; j < _WSOCS[i].remote_sites.length; j++) {
			var el = document.createElement(elementType);
			el.innerHTML = eval(value);
			if (typeof color != null) {
				el.style.backgroundColor = eval(color);
			}
			var id = row+"_"+_WSOCS[i].remote_sites[j].site;
			el.id = id;
			tr.appendChild(el);
		}
	}
}

/* buildSiteStatusRow
 * Appends the WSOC nodes (as defined in the variables JSON definition) to the 
 * Architecture Capability Matrix on the home page.
 */
function buildSiteStatusRow(row, elementType, value, color, elClass) {
	var tr = document.getElementById(row);
	for (var i = 0; i < _WSOCS.length; i++) {
		var el = document.createElement(elementType);
		el.innerHTML = eval(value);
		el.className = elClass;
		if (typeof color != null) {
			el.style.backgroundColor = eval(color);
		}
		el.colSpan = _WSOCS[i].remote_sites.length;
		var id = row+"_"+_WSOCS[i].site;
		el.id = id;
		tr.appendChild(el);
	}
}

/* buildObject
 * builds a Site Status Object from the input string.
 */
function buildSiteObjectFromMessage(string) {
	var ssrArr = string.split(/[0-9]+\./);
	var obj = {};

	for (var i = 1; i < ssrArr.length; i ++) {
		// Tidy up extra newline characters at start and end of items
		if (ssrArr[i].slice(0,1) == "\n") {
			ssrArr[i] = ssrArr[i].slice(1);
		}
		if (ssrArr[i].slice(-1) == "\n") {
			ssrArr[i] = ssrArr[i].slice(0,-1);
		}
	}
	
	obj.site = ssrArr[1];
	obj.dtg = ssrArr[2];
	obj.site_opscap = ssrArr[3];
	obj.equipment_configuration = buildSubObject(ssrArr[4]);
	obj.site_syscap = buildSyscap(obj.equipment_configuration, obj.site);
	obj.quicklooks = buildSubObject(ssrArr[5]);
	obj.hazcon = ssrArr[6];
	obj.infocon = ssrArr[7];
	obj.fpcon = ssrArr[8];
	obj.remarks = ssrArr[9];
	obj.chops = ssrArr[10];
	
	return obj;
}

/* buildSyscap
 * Iterates over equipment_configurations to identify the most severe
 * SYSCAP rating and returns this.
 */
function buildSyscap(obj, site) {
	var syscap = 0;
	console.log(obj);
	for (var i = 0; i < obj.length; i++) {
		if (obj[i].site == site && obj[i].syscap > syscap) {
			syscap = obj[i].syscap;
		} 
	}
	return syscap;
}

/* buildSubObject
 * Builds sub objects (like quicklooks and equipment configurations)
 * based on a string input stream, \n defines a new entry ', ' separates attributes
 * and ':' separates attribute names and values.
 */
function buildSubObject(strings) {
	var arr = [];
	strings = strings.split(/\n/);
	for (var i = 0; i < strings.length; i++) {
		var string = strings[i]
		var attributes = string.split(", ");
		var subObj = {};
		for (var j = 0; j < attributes.length; j++) {
			var attribute = attributes[j].split(":");
			subObj[attribute[0].toLowerCase()] = attribute[1];
		}
		arr.push(subObj);
	}
	return arr;
}

/* getSiteStatusReports
 * Iterate over the sites defined in variables file and lookup the Site Status Reports
 * once found, return an array of objects built by buildObject.
 */
function getSiteStatusReports() {
	var arr = [];
	
	for (var i = 0; i < _WSOCS.length; i++) {
		var obj = buildSiteObjectFromMessage(document.getElementById(_WSOCS[i].site+"-site-status-text").value);
		arr.push(obj);
	}
	
	return arr;
}

/* colorizeCap
 * set the style classes for the DOM element ID passed as id to the appropriate OPSCAP/SYSCAP status
 */
function colorizeCap(id, site_cap) {
	console.log("colorizeCap");
	var el = document.getElementById(id);
	if (site_cap == 0) {
		el.setAttribute("class", "status cap-green");
	}
	else if (site_cap == 1) {
		el.setAttribute("class", "status cap-amber");
	}
	else if (site_cap == 2) {
		el.setAttribute("class", "status cap-red");
	}
	else {
		el.setAttribute("class", "status");
	}
}


/* populateSiteStatusDetails
 * Populates strings on the Site Status Details page from Site Status Object for
 * relevant site.
 */
function populateSiteStatusDetails(obj, table, rowId, type) {
	for (var i = 0; i < obj.length; i++) {
		if (i > 0) {
			addRow(table, rowId);
		}

		var keys = Object.keys(obj[i]);

		for (var j = 0; j < keys.length; j++) {
			var el = keys[j]+"["+i+"]";
			var at = obj[i][keys[j]];

			if (type == "details") {
				document.getElementById(el).innerHTML = at;
			}
			else if (type == "editor") {
				document.getElementById(el).value = at;
			}

			if (el.indexOf("allocation") >= 0) {
				colorize(document.getElementById(el), at);
			}

			if (el.indexOf("cap") >= 0) {
				colorize(document.getElementById(el), at);
			}
		}
	}
}

/* addRow
 * For the defined table, this duplicates the first row and adjust the td element id's to ensure
 * they are unique.
 */
function addRow(table, rowId) {
	console.log('addRow');
	
	var row = document.getElementById(rowId+"[0]");
	
	var lastId = document.getElementById(table).getElementsByTagName("tr").length-3;
	var newId = lastId+1;
	
	// Copy the element and its child nodes
	var clone = row.cloneNode(true);
	clone.id = rowId+'['+newId+']';
	clone.style.visibility = "visible";

	var els = clone.getElementsByTagName('td');
	for (var i = 0; i < els.length; i++) {
		var elId = els[i].children[0].id;
		var elIdRoot = elId.split('[');
		var elNewId = elIdRoot[0]+'['+newId+']';
		els[i].children[0].id = elNewId;
		els[i].children[0].setAttribute("name", elNewId);
	}

	// Append the cloned element
	document.getElementById(table).tBodies[0].appendChild(clone);
	
}

/* removeRow
 * For the defined table, this removes the last row of the table
 */
function removeRow(table, rowId) {
	console.log('removeClicked');
	
	var lastId = document.getElementById(table).getElementsByTagName("tr").length-3;
	
	if (lastId != 0) {
		var element = document.getElementById(rowId+"["+lastId+"]");
		element.outerHTML = "";
		delete element;
	}
}

/* setCanvasWidth
 * Discovers the width and padding of the container div and adjusts the canvas width to suit
 */
function setCanvasWidth() {
	var divWidth = document.getElementById("canvas-div").offsetWidth
	var leftPadding = window.getComputedStyle(document.getElementById("canvas-div"), null).getPropertyValue('padding-left').slice(0,-2);
	var rightPadding = window.getComputedStyle(document.getElementById("canvas-div"), null).getPropertyValue('padding-right').slice(0,-2);
	var canvasWidth = divWidth-(leftPadding+rightPadding);
	
	document.getElementById("commandAlignment").setAttribute("width", canvasWidth+"px");
}

/* uniqueElements
 * given an array of objects it identifies and returns an array of unique elements
 * from one given object attribute.
 */
function uniqueElements(obj, attr) {
	console.log("uniqueElements");
	var elArr = [];
	for (var i = 0; i < obj.length; i++) {
		var el = obj[i][attr];
	
	    if (!(el in elArr)) {
	      elArr.push(el);
	    }
	}
	var a = [];
	for (var i=0, l=elArr.length; i<l; i++) {
		if (a.indexOf(elArr[i]) === -1 && elArr[i] !== '') {
			a.push(elArr[i]);
		}
	}
	return a;
}

/* parseURL
 * A simple parser that grabs the first parameter from the URL
 */
function parseURLParam(url) {
    var paramStart = url.indexOf('=');
	var param = url.slice(paramStart+1);
		
	return param;
}

/* colorize
 * Sets the css class based upon Pri/Alt and status
 */
function colorize(element, value) {
	console.log("colorize " + element.id);
	var elClass = element.className;
	console.log(elClass);
	if (element.id.indexOf("alloc") >= 0) {
		if (value == 0) {
			document.getElementById(element.id).setAttribute("class", "status pace-pri");
		}
		else if (value == 1) {
			document.getElementById(element.id).setAttribute("class", "status pace-alt");
		}
	}
	else {
		if (value == 0) {
			document.getElementById(element.id).setAttribute("class", "status cap-green");
		}
		else if (value == 1) {
			document.getElementById(element.id).setAttribute("class", "status cap-amber");
		}
		else if (value == 2) {
			document.getElementById(element.id).setAttribute("class", "status cap-red");
		}
		else if (value == 3) {
			document.getElementById(element.id).setAttribute("class", "status");
		}
	}
}

/* setTime
 * Sets value of the correct_as_at field of the site status report builder.
 * This is called on a time interval.
 */
function setTime() {
	var date = new Date();
	document.getElementById("dtg").value = date;
}

/* writeSiteStatus
 * Builds string for Site Status for dissemination.
 */ 
function writeSiteStatus(obj) {
	var string = "";
	
	string += "1.\n"+obj.site+"\n";
	string += "2.\n"+obj.dtg+"\n";
	string += "3.\n"+obj.site_opscap+"\n";
	string += "4.\n";
	
	for (var i = 0; i < obj.equipment_configuration.length; i++) {
		var subObj = obj.equipment_configuration[i];
		string += "Site:"+subObj.site+", Control_WSOC:"+subObj.control_wsoc+", Subsystem:"+subObj.subsystem+", String_Name:"+subObj.string_name+", Antenna:"+subObj.antenna+", Iron:"+subObj.iron+", Allocation:"+subObj.allocation+", SYSCAP:"+subObj.syscap+"\n";
	}
	
	string += "5.\n";
	
	for (var i = 0; i < obj.quicklooks.length; i++) {
		var subObj = obj.quicklooks[i];
		string += "QL_ID:"+subObj.id+", QL_Status:"+subObj.status+", QL_Title:"+subObj.title+"\n";
	}
	
	string += "6.\n"+obj.hazcon+"\n";
	string += "7.\n"+obj.infocon+"\n";
	string += "8.\n"+obj.fpcon+"\n";
	string += "9.\n"+obj.remarks+"\n";
	string += "10.\n"+obj.chops+"\n";
	
	return string;
}

/* buildObject
 * Build Site Status Object from siteStatusBuilder.html form fields.
 */
function buildSiteObjectFromBuilder() {
	console.log('buildObject');

	var obj = {};

	obj.site = document.getElementById("site").value;
	obj.dtg = Date.parse(document.getElementById("dtg").value);
	obj.site_opscap = document.getElementById("site_opscap").value;
	obj.site_syscap = document.getElementById("site_syscap").value;
	obj.fpcon = document.getElementById("fpcon").value;
	obj.infocon = document.getElementById("infocon").value;
	obj.hazcon = document.getElementById("hazcon").value;
	obj.remarks = document.getElementById("remarks").value;
	obj.chops = document.getElementById("chops").value;

	obj.equipment_configuration = [];
	var strings = document.getElementsByClassName("string");

	// Iterate over the operational configuration elements and build subObj
	for (var i = 0; i < strings.length; i++) {
		var subObj = {};

		subObj.site = document.getElementById("site["+i+"]").value;
		subObj.control_wsoc = document.getElementById("control_wsoc["+i+"]").value;
		subObj.subsystem = document.getElementById("subsystem["+i+"]").value;
		subObj.string_name = document.getElementById("string_name["+i+"]").value;
		subObj.antenna = document.getElementById("antenna["+i+"]").value;
		subObj.iron = document.getElementById("iron["+i+"]").value;
		subObj.allocation = document.getElementById("allocation["+i+"]").value;
		subObj.syscap = document.getElementById("syscap["+i+"]").value;

		obj.equipment_configuration.push(subObj);
	}
	
	obj.quicklooks = [];
	var quicklooks = document.getElementsByClassName("quicklook");

	for (var i = 0; i < quicklooks.length; i++) {
		var subObj = {};

		subObj.id = document.getElementById("ql_id["+i+"]").value;
		subObj.title = document.getElementById("ql_title["+i+"]").value;
		subObj.status = document.getElementById("ql_status["+i+"]").value;

		obj.quicklooks.push(subObj);
	}
	
	return obj;
}