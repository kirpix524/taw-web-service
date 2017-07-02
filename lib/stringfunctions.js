'use strict'
function piece(str, devider, firstpos, lastpos) {
	str = CString(str);
	let arr = str.toString().split(devider);
	let arrnew = [];
	firstpos = parseInt(firstpos);
	lastpos = parseInt(lastpos);
	if ((isNaN(firstpos)) || (firstpos == 0)) {
		firstpos = 1;
	}
	if ((isNaN(lastpos)) || (lastpos == 0)) {
		lastpos = firstpos;
	}
	firstpos = firstpos - 1;
	if (lastpos > arr.length) {
		lastpos = arr.length;
	}
	if (firstpos > lastpos) {
		return "";
	}
	for (let i = firstpos; i < lastpos; i++) {
		arrnew.push(arr[i]);
	}
	return arrnew.join(devider)

}

function intdiv(x, y) {
	return (x - x % y) / y
}

function lpad(str, length, symbol) {
	var arr = str.split('');
	if (arr.length < length) {
		var add = length - arr.length;
		for (var i = 0; i < add; i++) {
			arr.unshift(symbol.charAt(0));
		}
	}
	return arr.join('')
}

function rpad(str, length, symbol) {
	var arr = str.split('');
	if (arr.length < length) {
		var add = length - arr.length;
		for (var i = 0; i < add; i++) {
			arr.push(symbol.charAt(0));
		}
	}
	return arr.join('')
}

function $f(str, char, startpos) {
	var rez = 0;
	if (+startpos == 0) {
		startpos = 1;
	}
	var tmpMas = str.split('');
	if (startpos > tmpMas.length) {
		startpos = tmpMas.length;
	}

	for (var i = startpos - 1; i < tmpMas.length; i++) {
		if (rez == 0) {
			if (tmpMas[i] == char) {
				rez = i + 1;
			}
		}
	}
	return rez
}

function formatDate(date, format) {
	format = format || "dd.mm.yy";
	var dd = date.getDate();
	if (dd < 10) dd = '0' + dd;

	var mm = date.getMonth() + 1;
	if (mm < 10) mm = '0' + mm;

	var yy = date.getFullYear() % 100;
	if (yy < 10) yy = '0' + yy;

	if (format == "dd.mm.yy") {
		return dd + '.' + mm + '.' + yy;
	} else if (format == "yyyy-mm-dd") {
		yy = date.getFullYear();
		return yy + '-' + mm + '-' + dd;
	}

}

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function CNumber(num) {
	if (isNumeric(num)) {
		return +num;
	} else {
		return 0;
	}
}

function CString(str) {
	str = String(str);
	if ((str == "null") || (str == "undefined")) {
		return "";
	}
	return str;
}

function daysBetween(dateFrom, dateTo) {
	let dateFromLoc=new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
	let dateToLoc=new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());

	if ((dateToLoc-dateFromLoc)<=0) {
		return 0;
	}
	let dateLoc=new Date(dateFromLoc)
	for (let days=0; days<1000; days++) {
		dateLoc.setDate(dateFromLoc.getDate()+days);
		if ((dateLoc.getFullYear()==dateToLoc.getFullYear()) && (dateLoc.getDate()==dateToLoc.getDate()) && (dateLoc.getMonth()==dateToLoc.getMonth())) {
			return days;
		}
	}
	return -1;
}

exports.piece = piece;
exports.intdiv = intdiv;
exports.lpad = lpad;
exports.rpad = rpad;
exports.$f = $f;
exports.formatDate = formatDate;
exports.CNumber = CNumber;
exports.isNumeric = isNumeric;
exports.CString = CString;
exports.daysBetween = daysBetween;