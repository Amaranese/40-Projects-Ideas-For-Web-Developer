'use strict';

var babylon = function () {
	function unwrapExports(x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var parserBabylon_1 = createCommonjsModule(function (module) {
		"use strict";
		function createError(t, e) {
			var s = new SyntaxError(t + " (" + e.start.line + ":" + e.start.column + ")");return s.loc = e, s;
		}var parserCreateError = createError;function unwrapExports$$1(t) {
			return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
		}function createCommonjsModule$$1(t, e) {
			return t(e = { exports: {} }, e.exports), e.exports;
		}var lib = createCommonjsModule$$1(function (t, e) {
			function s(t, e) {
				t.prototype = Object.create(e.prototype), t.prototype.constructor = t, t.__proto__ = e;
			}Object.defineProperty(e, "__esModule", { value: !0 });var i = { sourceType: "script", sourceFilename: void 0, startLine: 1, allowReturnOutsideFunction: !1, allowImportExportEverywhere: !1, allowSuperOutsideMethod: !1, plugins: [], strictMode: null, ranges: !1, tokens: !1 };var r = !0,
			    a = function a(t, e) {
				void 0 === e && (e = {}), this.label = t, this.keyword = e.keyword, this.beforeExpr = !!e.beforeExpr, this.startsExpr = !!e.startsExpr, this.rightAssociative = !!e.rightAssociative, this.isLoop = !!e.isLoop, this.isAssign = !!e.isAssign, this.prefix = !!e.prefix, this.postfix = !!e.postfix, this.binop = 0 === e.binop ? 0 : e.binop || null, this.updateContext = null;
			},
			    n = function (t) {
				function e(e, s) {
					return void 0 === s && (s = {}), s.keyword = e, t.call(this, e, s) || this;
				}return s(e, t), e;
			}(a),
			    o = function (t) {
				function e(e, s) {
					return t.call(this, e, { beforeExpr: r, binop: s }) || this;
				}return s(e, t), e;
			}(a),
			    h = { num: new a("num", { startsExpr: !0 }), bigint: new a("bigint", { startsExpr: !0 }), regexp: new a("regexp", { startsExpr: !0 }), string: new a("string", { startsExpr: !0 }), name: new a("name", { startsExpr: !0 }), eof: new a("eof"), bracketL: new a("[", { beforeExpr: r, startsExpr: !0 }), bracketR: new a("]"), braceL: new a("{", { beforeExpr: r, startsExpr: !0 }), braceBarL: new a("{|", { beforeExpr: r, startsExpr: !0 }), braceR: new a("}"), braceBarR: new a("|}"), parenL: new a("(", { beforeExpr: r, startsExpr: !0 }), parenR: new a(")"), comma: new a(",", { beforeExpr: r }), semi: new a(";", { beforeExpr: r }), colon: new a(":", { beforeExpr: r }), doubleColon: new a("::", { beforeExpr: r }), dot: new a("."), question: new a("?", { beforeExpr: r }), questionDot: new a("?."), arrow: new a("=>", { beforeExpr: r }), template: new a("template"), ellipsis: new a("...", { beforeExpr: r }), backQuote: new a("`", { startsExpr: !0 }), dollarBraceL: new a("${", { beforeExpr: r, startsExpr: !0 }), at: new a("@"), hash: new a("#"), eq: new a("=", { beforeExpr: r, isAssign: !0 }), assign: new a("_=", { beforeExpr: r, isAssign: !0 }), incDec: new a("++/--", { prefix: !0, postfix: !0, startsExpr: !0 }), bang: new a("!", { beforeExpr: r, prefix: !0, startsExpr: !0 }), tilde: new a("~", { beforeExpr: r, prefix: !0, startsExpr: !0 }), pipeline: new o("|>", 0), nullishCoalescing: new o("??", 1), logicalOR: new o("||", 1), logicalAND: new o("&&", 2), bitwiseOR: new o("|", 3), bitwiseXOR: new o("^", 4), bitwiseAND: new o("&", 5), equality: new o("==/!=", 6), relational: new o("</>", 7), bitShift: new o("<</>>", 8), plusMin: new a("+/-", { beforeExpr: r, binop: 9, prefix: !0, startsExpr: !0 }), modulo: new o("%", 10), star: new o("*", 10), slash: new o("/", 10), exponent: new a("**", { beforeExpr: r, binop: 11, rightAssociative: !0 }) },
			    p = { break: new n("break"), case: new n("case", { beforeExpr: r }), catch: new n("catch"), continue: new n("continue"), debugger: new n("debugger"), default: new n("default", { beforeExpr: r }), do: new n("do", { isLoop: !0, beforeExpr: r }), else: new n("else", { beforeExpr: r }), finally: new n("finally"), for: new n("for", { isLoop: !0 }), function: new n("function", { startsExpr: !0 }), if: new n("if"), return: new n("return", { beforeExpr: r }), switch: new n("switch"), throw: new n("throw", { beforeExpr: r, prefix: !0, startsExpr: !0 }), try: new n("try"), var: new n("var"), let: new n("let"), const: new n("const"), while: new n("while", { isLoop: !0 }), with: new n("with"), new: new n("new", { beforeExpr: r, startsExpr: !0 }), this: new n("this", { startsExpr: !0 }), super: new n("super", { startsExpr: !0 }), class: new n("class"), extends: new n("extends", { beforeExpr: r }), export: new n("export"), import: new n("import", { startsExpr: !0 }), yield: new n("yield", { beforeExpr: r, startsExpr: !0 }), null: new n("null", { startsExpr: !0 }), true: new n("true", { startsExpr: !0 }), false: new n("false", { startsExpr: !0 }), in: new n("in", { beforeExpr: r, binop: 7 }), instanceof: new n("instanceof", { beforeExpr: r, binop: 7 }), typeof: new n("typeof", { beforeExpr: r, prefix: !0, startsExpr: !0 }), void: new n("void", { beforeExpr: r, prefix: !0, startsExpr: !0 }), delete: new n("delete", { beforeExpr: r, prefix: !0, startsExpr: !0 }) };function c(t) {
				var e = t.split(" ");return function (t) {
					return e.indexOf(t) >= 0;
				};
			}Object.keys(p).forEach(function (t) {
				h["_" + t] = p[t];
			});var l = { 6: c("enum await"), strict: c("implements interface let package private protected public static yield"), strictBind: c("eval arguments") },
			    u = c("break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this let const class extends export import yield super"),
			    d = "????????-????-????-????-????-????????-????????-????????-??????-????-????-????-????-??????-????-????-????-????????-??????????????-????????-????-??????-???????????-???????????????-??????-??????-??????-????????????-??????-??????-????????????-??????-?????????-??????????????????-????????????-????????????-??????-????????????????????????-?????????-??????-??????-??????-??????-????????????-?????????????????????-????????????-??????-????????????-???????????????-????????????-??????-??????-???????????????????????????-??????-?????????-??????-??????-??????-?????????-???????????????-??????-??????-??????-??????-????????????????????????-??????-??????-????????????-??????-??????-??????-??????-??????-?????????-??????-????????????-???????????????????????????-??????-??????-??????????????????-???????????????-?????????-?????????-??????-??????-??????-?????????-??????-???????????????-??????-?????????-????????????-??????-??????-??????-?????????-??????-??????-??????-??????-??????-?????????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-????????????-??????-?????????-??????-??????-??????-??????-??????-??????-??????-?????????-??????-??????-????????????-??????-??????-??????-??????-??????-??????-????????????-??????-??????-??????-??????-??????-???????????????-??????-??????-?????????-??????-??????-??????-??????-??????-??????-????????????-????????????-?????????-???????????????-??????-??????-?????????-??????-??????-??????-??????-????????????-????????????-?????????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-????????????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-????????????-??????-??????-??????-?????????-??????-??????-??????-??????-??????-??????-?????????-???????????????-????????????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-?????????-??????-??????-?????????????????????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-???",
			    f = "??????????-??????-????-????????????????-????-??????-????-????????-????-??????-????-????-????-?????-??????-??????-??????-??????-??????-??????-??????-??????-??????-????????????-??????-?????????-????????????-???????????????-??????-?????????-????????????-?????????-?????????-?????????-??????-??????-????????????-??????-?????????-????????????-??????????????????-?????????-??????-??????-?????????-??????-??????-??????-??????-??????????????????-??????-?????????-??????-??????-??????????????????-??????-??????-??????-??????-???????????????-???????????????-?????????-??????-???????????????-??????-??????-?????????-????????????-??????-????????????-?????????????????????-????????????-??????-?????????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????????????????-?????????-??????-??????-?????????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-??????-?????????-????????????-??????-???????????????-?????????-??????-?????????-??????-????????????-?????????-???????????????????????????-????????????-??????-??????-??????-??????-??????-??????-??????-??????-?????????-??????-???????????????-??????-?????????-?????????????????????-????????????-????????????-?????????-??????-????????????-??????-??????",
			    m = new RegExp("[" + d + "]"),
			    y = new RegExp("[" + d + f + "]");d = f = null;var x = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 17, 26, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 26, 45, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 785, 52, 76, 44, 33, 24, 27, 35, 42, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 85, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 159, 52, 19, 3, 54, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 86, 25, 391, 63, 32, 0, 449, 56, 264, 8, 2, 36, 18, 0, 50, 29, 881, 921, 103, 110, 18, 195, 2749, 1070, 4050, 582, 8634, 568, 8, 30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 881, 68, 12, 0, 67, 12, 65, 0, 32, 6124, 20, 754, 9486, 1, 3071, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 4149, 196, 60, 67, 1213, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42710, 42, 4148, 12, 221, 3, 5761, 10591, 541],
			    P = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 1306, 2, 54, 14, 32, 9, 16, 3, 46, 10, 54, 9, 7, 2, 37, 13, 2, 9, 52, 0, 13, 2, 49, 13, 10, 2, 4, 9, 83, 11, 7, 0, 161, 11, 6, 9, 7, 3, 57, 0, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 193, 17, 10, 9, 87, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 84, 14, 5, 9, 423, 9, 838, 7, 2, 7, 17, 9, 57, 21, 2, 13, 19882, 9, 135, 4, 60, 6, 26, 9, 1016, 45, 17, 3, 19723, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 2214, 6, 110, 6, 6, 9, 792487, 239];function v(t, e) {
				for (var s = 65536, i = 0; i < e.length; i += 2) {
					if ((s += e[i]) > t) return !1;if ((s += e[i + 1]) >= t) return !0;
				}return !1;
			}function g(t) {
				return t < 65 ? 36 === t : t < 91 || (t < 97 ? 95 === t : t < 123 || (t <= 65535 ? t >= 170 && m.test(String.fromCharCode(t)) : v(t, x)));
			}function b(t) {
				return t < 48 ? 36 === t : t < 58 || !(t < 65) && (t < 91 || (t < 97 ? 95 === t : t < 123 || (t <= 65535 ? t >= 170 && y.test(String.fromCharCode(t)) : v(t, x) || v(t, P))));
			}var T = /\r\n?|\n|\u2028|\u2029/,
			    w = new RegExp(T.source, "g");function A(t) {
				return 10 === t || 13 === t || 8232 === t || 8233 === t;
			}var N = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/,
			    C = function C(t, e, s, i) {
				this.token = t, this.isExpr = !!e, this.preserveSpace = !!s, this.override = i;
			},
			    E = { braceStatement: new C("{", !1), braceExpression: new C("{", !0), templateQuasi: new C("${", !0), parenStatement: new C("(", !1), parenExpression: new C("(", !0), template: new C("`", !0, !0, function (t) {
					return t.readTmplToken();
				}), functionExpression: new C("function", !0) };h.parenR.updateContext = h.braceR.updateContext = function () {
				if (1 !== this.state.context.length) {
					var t = this.state.context.pop();t === E.braceStatement && this.curContext() === E.functionExpression ? (this.state.context.pop(), this.state.exprAllowed = !1) : t === E.templateQuasi ? this.state.exprAllowed = !0 : this.state.exprAllowed = !t.isExpr;
				} else this.state.exprAllowed = !0;
			}, h.name.updateContext = function (t) {
				"of" !== this.state.value || this.curContext() !== E.parenStatement ? (this.state.exprAllowed = !1, t !== h._let && t !== h._const && t !== h._var || T.test(this.input.slice(this.state.end)) && (this.state.exprAllowed = !0)) : this.state.exprAllowed = !t.beforeExpr;
			}, h.braceL.updateContext = function (t) {
				this.state.context.push(this.braceIsBlock(t) ? E.braceStatement : E.braceExpression), this.state.exprAllowed = !0;
			}, h.dollarBraceL.updateContext = function () {
				this.state.context.push(E.templateQuasi), this.state.exprAllowed = !0;
			}, h.parenL.updateContext = function (t) {
				var e = t === h._if || t === h._for || t === h._with || t === h._while;this.state.context.push(e ? E.parenStatement : E.parenExpression), this.state.exprAllowed = !0;
			}, h.incDec.updateContext = function () {}, h._function.updateContext = function () {
				this.curContext() !== E.braceStatement && this.state.context.push(E.functionExpression), this.state.exprAllowed = !1;
			}, h.backQuote.updateContext = function () {
				this.curContext() === E.template ? this.state.context.pop() : this.state.context.push(E.template), this.state.exprAllowed = !1;
			};var k = function k(t, e) {
				this.line = t, this.column = e;
			},
			    S = function S(t, e) {
				this.start = t, this.end = e;
			};function L(t) {
				return t[t.length - 1];
			}var I = function (t) {
				function e() {
					return t.apply(this, arguments) || this;
				}return s(e, t), e.prototype.raise = function (t, e, s) {
					var i = function (t, e) {
						for (var s = 1, i = 0;;) {
							w.lastIndex = i;var r = w.exec(t);if (!(r && r.index < e)) return new k(s, e - i);++s, i = r.index + r[0].length;
						}throw new Error("Unreachable");
					}(this.input, t);e += ' (' + i.line + ':' + i.column + ')';var r = new SyntaxError(e);throw r.pos = t, r.loc = i, s && (r.missingPlugin = s), r;
				}, e;
			}(function (t) {
				function e() {
					return t.apply(this, arguments) || this;
				}s(e, t);var i = e.prototype;return i.addComment = function (t) {
					this.filename && (t.loc.filename = this.filename), this.state.trailingComments.push(t), this.state.leadingComments.push(t);
				}, i.processComment = function (t) {
					if (!("Program" === t.type && t.body.length > 0)) {
						var e,
						    s,
						    i,
						    r,
						    a,
						    n = this.state.commentStack;if (this.state.trailingComments.length > 0) this.state.trailingComments[0].start >= t.end ? (i = this.state.trailingComments, this.state.trailingComments = []) : this.state.trailingComments.length = 0;else if (n.length > 0) {
							var o = L(n);o.trailingComments && o.trailingComments[0].start >= t.end && (i = o.trailingComments, o.trailingComments = null);
						}for (n.length > 0 && L(n).start >= t.start && (e = n.pop()); n.length > 0 && L(n).start >= t.start;) {
							s = n.pop();
						}if (!s && e && (s = e), e && this.state.leadingComments.length > 0) {
							var h = L(this.state.leadingComments);if ("ObjectProperty" === e.type) {
								if (h.start >= t.start && this.state.commentPreviousNode) {
									for (a = 0; a < this.state.leadingComments.length; a++) {
										this.state.leadingComments[a].end < this.state.commentPreviousNode.end && (this.state.leadingComments.splice(a, 1), a--);
									}this.state.leadingComments.length > 0 && (e.trailingComments = this.state.leadingComments, this.state.leadingComments = []);
								}
							} else if ("CallExpression" === t.type && t.arguments && t.arguments.length) {
								var p = L(t.arguments);p && h.start >= p.start && h.end <= t.end && this.state.commentPreviousNode && this.state.leadingComments.length > 0 && (p.trailingComments = this.state.leadingComments, this.state.leadingComments = []);
							}
						}if (s) {
							if (s.leadingComments) if (s !== t && s.leadingComments.length > 0 && L(s.leadingComments).end <= t.start) t.leadingComments = s.leadingComments, s.leadingComments = null;else for (r = s.leadingComments.length - 2; r >= 0; --r) {
								if (s.leadingComments[r].end <= t.start) {
									t.leadingComments = s.leadingComments.splice(0, r + 1);break;
								}
							}
						} else if (this.state.leadingComments.length > 0) if (L(this.state.leadingComments).end <= t.start) {
							if (this.state.commentPreviousNode) for (a = 0; a < this.state.leadingComments.length; a++) {
								this.state.leadingComments[a].end < this.state.commentPreviousNode.end && (this.state.leadingComments.splice(a, 1), a--);
							}this.state.leadingComments.length > 0 && (t.leadingComments = this.state.leadingComments, this.state.leadingComments = []);
						} else {
							for (r = 0; r < this.state.leadingComments.length && !(this.state.leadingComments[r].end > t.start); r++) {}var c = this.state.leadingComments.slice(0, r);t.leadingComments = 0 === c.length ? null : c, 0 === (i = this.state.leadingComments.slice(r)).length && (i = null);
						}this.state.commentPreviousNode = t, i && (i.length && i[0].start >= t.start && L(i).end <= t.end ? t.innerComments = i : t.trailingComments = i), n.push(t);
					}
				}, e;
			}(function () {
				function t() {}var e = t.prototype;return e.isReservedWord = function (t) {
					return "await" === t ? this.inModule : l[6](t);
				}, e.hasPlugin = function (t) {
					return !!this.plugins[t];
				}, t;
			}())),
			    M = function () {
				function t() {}var e = t.prototype;return e.init = function (t, e) {
					this.strict = !1 !== t.strictMode && "module" === t.sourceType, this.input = e, this.potentialArrowAt = -1, this.noArrowAt = [], this.noArrowParamsConversionAt = [], this.inMethod = this.inFunction = this.inParameters = this.maybeInArrowParameters = this.inGenerator = this.inAsync = this.inPropertyName = this.inType = this.inClassProperty = this.noAnonFunctionType = !1, this.classLevel = 0, this.labels = [], this.decoratorStack = [[]], this.yieldInPossibleArrowParameters = null, this.tokens = [], this.comments = [], this.trailingComments = [], this.leadingComments = [], this.commentStack = [], this.commentPreviousNode = null, this.pos = this.lineStart = 0, this.curLine = t.startLine, this.type = h.eof, this.value = null, this.start = this.end = this.pos, this.startLoc = this.endLoc = this.curPosition(), this.lastTokEndLoc = this.lastTokStartLoc = null, this.lastTokStart = this.lastTokEnd = this.pos, this.context = [E.braceStatement], this.exprAllowed = !0, this.containsEsc = this.containsOctal = !1, this.octalPosition = null, this.invalidTemplateEscapePosition = null, this.exportedIdentifiers = [];
				}, e.curPosition = function () {
					return new k(this.curLine, this.pos - this.lineStart);
				}, e.clone = function (e) {
					var s = this,
					    i = new t();return Object.keys(this).forEach(function (t) {
						var r = s[t];e && "context" !== t || !Array.isArray(r) || (r = r.slice()), i[t] = r;
					}), i;
				}, t;
			}(),
			    D = function D(t) {
				return t >= 48 && t <= 57;
			},
			    O = { decBinOct: [46, 66, 69, 79, 95, 98, 101, 111], hex: [46, 88, 95, 120] },
			    R = { bin: [48, 49] };R.oct = R.bin.concat([50, 51, 52, 53, 54, 55]), R.dec = R.oct.concat([56, 57]), R.hex = R.dec.concat([65, 66, 67, 68, 69, 70, 97, 98, 99, 100, 101, 102]);function _(t) {
				return t <= 65535 ? String.fromCharCode(t) : String.fromCharCode(55296 + (t - 65536 >> 10), 56320 + (t - 65536 & 1023));
			}var j = function (t) {
				function e() {
					return t.apply(this, arguments) || this;
				}s(e, t);var i = e.prototype;return i.addExtra = function (t, e, s) {
					t && ((t.extra = t.extra || {})[e] = s);
				}, i.isRelational = function (t) {
					return this.match(h.relational) && this.state.value === t;
				}, i.expectRelational = function (t) {
					this.isRelational(t) ? this.next() : this.unexpected(null, h.relational);
				}, i.eatRelational = function (t) {
					return !!this.isRelational(t) && (this.next(), !0);
				}, i.isContextual = function (t) {
					return this.match(h.name) && this.state.value === t;
				}, i.isLookaheadContextual = function (t) {
					var e = this.lookahead();return e.type === h.name && e.value === t;
				}, i.eatContextual = function (t) {
					return this.state.value === t && this.eat(h.name);
				}, i.expectContextual = function (t, e) {
					this.eatContextual(t) || this.unexpected(null, e);
				}, i.canInsertSemicolon = function () {
					return this.match(h.eof) || this.match(h.braceR) || this.hasPrecedingLineBreak();
				}, i.hasPrecedingLineBreak = function () {
					return T.test(this.input.slice(this.state.lastTokEnd, this.state.start));
				}, i.isLineTerminator = function () {
					return this.eat(h.semi) || this.canInsertSemicolon();
				}, i.semicolon = function () {
					this.isLineTerminator() || this.unexpected(null, h.semi);
				}, i.expect = function (t, e) {
					this.eat(t) || this.unexpected(e, t);
				}, i.unexpected = function (t, e) {
					throw void 0 === e && (e = "Unexpected token"), "string" != typeof e && (e = 'Unexpected token, expected "' + e.label + '"'), this.raise(null != t ? t : this.state.start, e);
				}, i.expectPlugin = function (t, e) {
					if (!this.hasPlugin(t)) throw this.raise(null != e ? e : this.state.start, 'This experimental syntax requires enabling the parser plugin: \'' + t + '\'', [t]);return !0;
				}, i.expectOnePlugin = function (t, e) {
					var s = this;if (!t.some(function (t) {
						return s.hasPlugin(t);
					})) throw this.raise(null != e ? e : this.state.start, 'This experimental syntax requires enabling one of the following parser plugin(s): \'' + t.join(", ") + '\'', t);
				}, e;
			}(function (t) {
				function e(e, s) {
					var i;return (i = t.call(this) || this).state = new M(), i.state.init(e, s), i.isLookahead = !1, i;
				}s(e, t);var i = e.prototype;return i.next = function () {
					this.options.tokens && !this.isLookahead && this.state.tokens.push(new function (t) {
						this.type = t.type, this.value = t.value, this.start = t.start, this.end = t.end, this.loc = new S(t.startLoc, t.endLoc);
					}(this.state)), this.state.lastTokEnd = this.state.end, this.state.lastTokStart = this.state.start, this.state.lastTokEndLoc = this.state.endLoc, this.state.lastTokStartLoc = this.state.startLoc, this.nextToken();
				}, i.eat = function (t) {
					return !!this.match(t) && (this.next(), !0);
				}, i.match = function (t) {
					return this.state.type === t;
				}, i.isKeyword = function (t) {
					return u(t);
				}, i.lookahead = function () {
					var t = this.state;this.state = t.clone(!0), this.isLookahead = !0, this.next(), this.isLookahead = !1;var e = this.state;return this.state = t, e;
				}, i.setStrict = function (t) {
					if (this.state.strict = t, this.match(h.num) || this.match(h.string)) {
						for (this.state.pos = this.state.start; this.state.pos < this.state.lineStart;) {
							this.state.lineStart = this.input.lastIndexOf("\n", this.state.lineStart - 2) + 1, --this.state.curLine;
						}this.nextToken();
					}
				}, i.curContext = function () {
					return this.state.context[this.state.context.length - 1];
				}, i.nextToken = function () {
					var t = this.curContext();t && t.preserveSpace || this.skipSpace(), this.state.containsOctal = !1, this.state.octalPosition = null, this.state.start = this.state.pos, this.state.startLoc = this.state.curPosition(), this.state.pos >= this.input.length ? this.finishToken(h.eof) : t.override ? t.override(this) : this.readToken(this.fullCharCodeAtPos());
				}, i.readToken = function (t) {
					g(t) || 92 === t ? this.readWord() : this.getTokenFromCode(t);
				}, i.fullCharCodeAtPos = function () {
					var t = this.input.charCodeAt(this.state.pos);return t <= 55295 || t >= 57344 ? t : (t << 10) + this.input.charCodeAt(this.state.pos + 1) - 56613888;
				}, i.pushComment = function (t, e, s, i, r, a) {
					var n = { type: t ? "CommentBlock" : "CommentLine", value: e, start: s, end: i, loc: new S(r, a) };this.isLookahead || (this.options.tokens && this.state.tokens.push(n), this.state.comments.push(n), this.addComment(n));
				}, i.skipBlockComment = function () {
					var t,
					    e = this.state.curPosition(),
					    s = this.state.pos,
					    i = this.input.indexOf("*/", this.state.pos += 2);for (-1 === i && this.raise(this.state.pos - 2, "Unterminated comment"), this.state.pos = i + 2, w.lastIndex = s; (t = w.exec(this.input)) && t.index < this.state.pos;) {
						++this.state.curLine, this.state.lineStart = t.index + t[0].length;
					}this.pushComment(!0, this.input.slice(s + 2, i), s, this.state.pos, e, this.state.curPosition());
				}, i.skipLineComment = function (t) {
					var e = this.state.pos,
					    s = this.state.curPosition(),
					    i = this.input.charCodeAt(this.state.pos += t);if (this.state.pos < this.input.length) for (; 10 !== i && 13 !== i && 8232 !== i && 8233 !== i && ++this.state.pos < this.input.length;) {
						i = this.input.charCodeAt(this.state.pos);
					}this.pushComment(!1, this.input.slice(e + t, this.state.pos), e, this.state.pos, s, this.state.curPosition());
				}, i.skipSpace = function () {
					t: for (; this.state.pos < this.input.length;) {
						var t = this.input.charCodeAt(this.state.pos);switch (t) {case 32:case 160:
								++this.state.pos;break;case 13:
								10 === this.input.charCodeAt(this.state.pos + 1) && ++this.state.pos;case 10:case 8232:case 8233:
								++this.state.pos, ++this.state.curLine, this.state.lineStart = this.state.pos;break;case 47:
								switch (this.input.charCodeAt(this.state.pos + 1)) {case 42:
										this.skipBlockComment();break;case 47:
										this.skipLineComment(2);break;default:
										break t;}break;default:
								if (!(t > 8 && t < 14 || t >= 5760 && N.test(String.fromCharCode(t)))) break t;++this.state.pos;}
					}
				}, i.finishToken = function (t, e) {
					this.state.end = this.state.pos, this.state.endLoc = this.state.curPosition();var s = this.state.type;this.state.type = t, this.state.value = e, this.updateContext(s);
				}, i.readToken_dot = function () {
					var t = this.input.charCodeAt(this.state.pos + 1);if (t >= 48 && t <= 57) this.readNumber(!0);else {
						var e = this.input.charCodeAt(this.state.pos + 2);46 === t && 46 === e ? (this.state.pos += 3, this.finishToken(h.ellipsis)) : (++this.state.pos, this.finishToken(h.dot));
					}
				}, i.readToken_slash = function () {
					if (this.state.exprAllowed) return ++this.state.pos, void this.readRegexp();61 === this.input.charCodeAt(this.state.pos + 1) ? this.finishOp(h.assign, 2) : this.finishOp(h.slash, 1);
				}, i.readToken_mult_modulo = function (t) {
					var e = 42 === t ? h.star : h.modulo,
					    s = 1,
					    i = this.input.charCodeAt(this.state.pos + 1),
					    r = this.state.exprAllowed;42 === t && 42 === i && (s++, i = this.input.charCodeAt(this.state.pos + 2), e = h.exponent), 61 !== i || r || (s++, e = h.assign), this.finishOp(e, s);
				}, i.readToken_pipe_amp = function (t) {
					var e = this.input.charCodeAt(this.state.pos + 1);if (e !== t) {
						if (124 === t) {
							if (62 === e) return void this.finishOp(h.pipeline, 2);if (125 === e && this.hasPlugin("flow")) return void this.finishOp(h.braceBarR, 2);
						}61 !== e ? this.finishOp(124 === t ? h.bitwiseOR : h.bitwiseAND, 1) : this.finishOp(h.assign, 2);
					} else this.finishOp(124 === t ? h.logicalOR : h.logicalAND, 2);
				}, i.readToken_caret = function () {
					61 === this.input.charCodeAt(this.state.pos + 1) ? this.finishOp(h.assign, 2) : this.finishOp(h.bitwiseXOR, 1);
				}, i.readToken_plus_min = function (t) {
					var e = this.input.charCodeAt(this.state.pos + 1);if (e === t) return 45 === e && !this.inModule && 62 === this.input.charCodeAt(this.state.pos + 2) && T.test(this.input.slice(this.state.lastTokEnd, this.state.pos)) ? (this.skipLineComment(3), this.skipSpace(), void this.nextToken()) : void this.finishOp(h.incDec, 2);61 === e ? this.finishOp(h.assign, 2) : this.finishOp(h.plusMin, 1);
				}, i.readToken_lt_gt = function (t) {
					var e = this.input.charCodeAt(this.state.pos + 1),
					    s = 1;return e === t ? (s = 62 === t && 62 === this.input.charCodeAt(this.state.pos + 2) ? 3 : 2, 61 === this.input.charCodeAt(this.state.pos + s) ? void this.finishOp(h.assign, s + 1) : void this.finishOp(h.bitShift, s)) : 33 !== e || 60 !== t || this.inModule || 45 !== this.input.charCodeAt(this.state.pos + 2) || 45 !== this.input.charCodeAt(this.state.pos + 3) ? (61 === e && (s = 2), void this.finishOp(h.relational, s)) : (this.skipLineComment(4), this.skipSpace(), void this.nextToken());
				}, i.readToken_eq_excl = function (t) {
					var e = this.input.charCodeAt(this.state.pos + 1);if (61 !== e) return 61 === t && 62 === e ? (this.state.pos += 2, void this.finishToken(h.arrow)) : void this.finishOp(61 === t ? h.eq : h.bang, 1);this.finishOp(h.equality, 61 === this.input.charCodeAt(this.state.pos + 2) ? 3 : 2);
				}, i.readToken_question = function () {
					var t = this.input.charCodeAt(this.state.pos + 1),
					    e = this.input.charCodeAt(this.state.pos + 2);63 === t ? this.finishOp(h.nullishCoalescing, 2) : 46 !== t || e >= 48 && e <= 57 ? (++this.state.pos, this.finishToken(h.question)) : (this.state.pos += 2, this.finishToken(h.questionDot));
				}, i.getTokenFromCode = function (t) {
					switch (t) {case 35:
							if ((this.hasPlugin("classPrivateProperties") || this.hasPlugin("classPrivateMethods")) && this.state.classLevel > 0) return ++this.state.pos, void this.finishToken(h.hash);this.raise(this.state.pos, 'Unexpected character \'' + _(t) + '\'');case 46:
							return void this.readToken_dot();case 40:
							return ++this.state.pos, void this.finishToken(h.parenL);case 41:
							return ++this.state.pos, void this.finishToken(h.parenR);case 59:
							return ++this.state.pos, void this.finishToken(h.semi);case 44:
							return ++this.state.pos, void this.finishToken(h.comma);case 91:
							return ++this.state.pos, void this.finishToken(h.bracketL);case 93:
							return ++this.state.pos, void this.finishToken(h.bracketR);case 123:
							return void (this.hasPlugin("flow") && 124 === this.input.charCodeAt(this.state.pos + 1) ? this.finishOp(h.braceBarL, 2) : (++this.state.pos, this.finishToken(h.braceL)));case 125:
							return ++this.state.pos, void this.finishToken(h.braceR);case 58:
							return void (this.hasPlugin("functionBind") && 58 === this.input.charCodeAt(this.state.pos + 1) ? this.finishOp(h.doubleColon, 2) : (++this.state.pos, this.finishToken(h.colon)));case 63:
							return void this.readToken_question();case 64:
							return ++this.state.pos, void this.finishToken(h.at);case 96:
							return ++this.state.pos, void this.finishToken(h.backQuote);case 48:
							var e = this.input.charCodeAt(this.state.pos + 1);if (120 === e || 88 === e) return void this.readRadixNumber(16);if (111 === e || 79 === e) return void this.readRadixNumber(8);if (98 === e || 66 === e) return void this.readRadixNumber(2);case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
							return void this.readNumber(!1);case 34:case 39:
							return void this.readString(t);case 47:
							return void this.readToken_slash();case 37:case 42:
							return void this.readToken_mult_modulo(t);case 124:case 38:
							return void this.readToken_pipe_amp(t);case 94:
							return void this.readToken_caret();case 43:case 45:
							return void this.readToken_plus_min(t);case 60:case 62:
							return void this.readToken_lt_gt(t);case 61:case 33:
							return void this.readToken_eq_excl(t);case 126:
							return void this.finishOp(h.tilde, 1);}this.raise(this.state.pos, 'Unexpected character \'' + _(t) + '\'');
				}, i.finishOp = function (t, e) {
					var s = this.input.slice(this.state.pos, this.state.pos + e);this.state.pos += e, this.finishToken(t, s);
				}, i.readRegexp = function () {
					for (var t, e, s = this.state.pos;;) {
						this.state.pos >= this.input.length && this.raise(s, "Unterminated regular expression");var i = this.input.charAt(this.state.pos);if (T.test(i) && this.raise(s, "Unterminated regular expression"), t) t = !1;else {
							if ("[" === i) e = !0;else if ("]" === i && e) e = !1;else if ("/" === i && !e) break;t = "\\" === i;
						}++this.state.pos;
					}var r = this.input.slice(s, this.state.pos);++this.state.pos;var a = this.readWord1();if (a) {
						/^[gmsiyu]*$/.test(a) || this.raise(s, "Invalid regular expression flag");
					}this.finishToken(h.regexp, { pattern: r, flags: a });
				}, i.readInt = function (t, e) {
					for (var s = this.state.pos, i = 16 === t ? O.hex : O.decBinOct, r = 16 === t ? R.hex : 10 === t ? R.dec : 8 === t ? R.oct : R.bin, a = 0, n = 0, o = null == e ? 1 / 0 : e; n < o; ++n) {
						var h = this.input.charCodeAt(this.state.pos),
						    p = void 0;if (this.hasPlugin("numericSeparator")) {
							var c = this.input.charCodeAt(this.state.pos - 1),
							    l = this.input.charCodeAt(this.state.pos + 1);if (95 === h) {
								-1 === r.indexOf(l) && this.raise(this.state.pos, "Invalid or unexpected token"), (i.indexOf(c) > -1 || i.indexOf(l) > -1 || Number.isNaN(l)) && this.raise(this.state.pos, "Invalid or unexpected token"), ++this.state.pos;continue;
							}
						}if ((p = h >= 97 ? h - 97 + 10 : h >= 65 ? h - 65 + 10 : D(h) ? h - 48 : 1 / 0) >= t) break;++this.state.pos, a = a * t + p;
					}return this.state.pos === s || null != e && this.state.pos - s !== e ? null : a;
				}, i.readRadixNumber = function (t) {
					var e = this.state.pos,
					    s = !1;this.state.pos += 2;var i = this.readInt(t);if (null == i && this.raise(this.state.start + 2, "Expected number in radix " + t), this.hasPlugin("bigInt") && 110 === this.input.charCodeAt(this.state.pos) && (++this.state.pos, s = !0), g(this.fullCharCodeAtPos()) && this.raise(this.state.pos, "Identifier directly after number"), s) {
						var r = this.input.slice(e, this.state.pos).replace(/[_n]/g, "");this.finishToken(h.bigint, r);
					} else this.finishToken(h.num, i);
				}, i.readNumber = function (t) {
					var e = this.state.pos,
					    s = 48 === this.input.charCodeAt(e),
					    i = !1,
					    r = !1;t || null !== this.readInt(10) || this.raise(e, "Invalid number"), s && this.state.pos == e + 1 && (s = !1);var a = this.input.charCodeAt(this.state.pos);46 !== a || s || (++this.state.pos, this.readInt(10), i = !0, a = this.input.charCodeAt(this.state.pos)), 69 !== a && 101 !== a || s || (43 !== (a = this.input.charCodeAt(++this.state.pos)) && 45 !== a || ++this.state.pos, null === this.readInt(10) && this.raise(e, "Invalid number"), i = !0, a = this.input.charCodeAt(this.state.pos)), this.hasPlugin("bigInt") && 110 === a && ((i || s) && this.raise(e, "Invalid BigIntLiteral"), ++this.state.pos, r = !0), g(this.fullCharCodeAtPos()) && this.raise(this.state.pos, "Identifier directly after number");var n,
					    o = this.input.slice(e, this.state.pos).replace(/[_n]/g, "");r ? this.finishToken(h.bigint, o) : (i ? n = parseFloat(o) : s && 1 !== o.length ? this.state.strict ? this.raise(e, "Invalid number") : n = /[89]/.test(o) ? parseInt(o, 10) : parseInt(o, 8) : n = parseInt(o, 10), this.finishToken(h.num, n));
				}, i.readCodePoint = function (t) {
					var e;if (123 === this.input.charCodeAt(this.state.pos)) {
						var s = ++this.state.pos;if (e = this.readHexChar(this.input.indexOf("}", this.state.pos) - this.state.pos, t), ++this.state.pos, null === e) --this.state.invalidTemplateEscapePosition;else if (e > 1114111) {
							if (!t) return this.state.invalidTemplateEscapePosition = s - 2, null;this.raise(s, "Code point out of bounds");
						}
					} else e = this.readHexChar(4, t);return e;
				}, i.readString = function (t) {
					for (var e = "", s = ++this.state.pos;;) {
						this.state.pos >= this.input.length && this.raise(this.state.start, "Unterminated string constant");var i = this.input.charCodeAt(this.state.pos);if (i === t) break;92 === i ? (e += this.input.slice(s, this.state.pos), e += this.readEscapedChar(!1), s = this.state.pos) : (A(i) && this.raise(this.state.start, "Unterminated string constant"), ++this.state.pos);
					}e += this.input.slice(s, this.state.pos++), this.finishToken(h.string, e);
				}, i.readTmplToken = function () {
					for (var t = "", e = this.state.pos, s = !1;;) {
						this.state.pos >= this.input.length && this.raise(this.state.start, "Unterminated template");var i = this.input.charCodeAt(this.state.pos);if (96 === i || 36 === i && 123 === this.input.charCodeAt(this.state.pos + 1)) return this.state.pos === this.state.start && this.match(h.template) ? 36 === i ? (this.state.pos += 2, void this.finishToken(h.dollarBraceL)) : (++this.state.pos, void this.finishToken(h.backQuote)) : (t += this.input.slice(e, this.state.pos), void this.finishToken(h.template, s ? null : t));if (92 === i) {
							t += this.input.slice(e, this.state.pos);var r = this.readEscapedChar(!0);null === r ? s = !0 : t += r, e = this.state.pos;
						} else if (A(i)) {
							switch (t += this.input.slice(e, this.state.pos), ++this.state.pos, i) {case 13:
									10 === this.input.charCodeAt(this.state.pos) && ++this.state.pos;case 10:
									t += "\n";break;default:
									t += String.fromCharCode(i);}++this.state.curLine, this.state.lineStart = this.state.pos, e = this.state.pos;
						} else ++this.state.pos;
					}
				}, i.readEscapedChar = function (t) {
					var e = !t,
					    s = this.input.charCodeAt(++this.state.pos);switch (++this.state.pos, s) {case 110:
							return "\n";case 114:
							return "\r";case 120:
							var i = this.readHexChar(2, e);return null === i ? null : String.fromCharCode(i);case 117:
							var r = this.readCodePoint(e);return null === r ? null : _(r);case 116:
							return "\t";case 98:
							return "\b";case 118:
							return "\v";case 102:
							return "\f";case 13:
							10 === this.input.charCodeAt(this.state.pos) && ++this.state.pos;case 10:
							return this.state.lineStart = this.state.pos, ++this.state.curLine, "";default:
							if (s >= 48 && s <= 55) {
								var a = this.state.pos - 1,
								    n = this.input.substr(this.state.pos - 1, 3).match(/^[0-7]+/)[0],
								    o = parseInt(n, 8);if (o > 255 && (n = n.slice(0, -1), o = parseInt(n, 8)), o > 0) {
									if (t) return this.state.invalidTemplateEscapePosition = a, null;this.state.strict ? this.raise(a, "Octal literal in strict mode") : this.state.containsOctal || (this.state.containsOctal = !0, this.state.octalPosition = a);
								}return this.state.pos += n.length - 1, String.fromCharCode(o);
							}return String.fromCharCode(s);}
				}, i.readHexChar = function (t, e) {
					var s = this.state.pos,
					    i = this.readInt(16, t);return null === i && (e ? this.raise(s, "Bad character escape sequence") : (this.state.pos = s - 1, this.state.invalidTemplateEscapePosition = s - 1)), i;
				}, i.readWord1 = function () {
					this.state.containsEsc = !1;for (var t = "", e = !0, s = this.state.pos; this.state.pos < this.input.length;) {
						var i = this.fullCharCodeAtPos();if (b(i)) this.state.pos += i <= 65535 ? 1 : 2;else {
							if (92 !== i) break;this.state.containsEsc = !0, t += this.input.slice(s, this.state.pos);var r = this.state.pos;117 !== this.input.charCodeAt(++this.state.pos) && this.raise(this.state.pos, 'Expecting Unicode escape sequence \\uXXXX'), ++this.state.pos;var a = this.readCodePoint(!0);(e ? g : b)(a, !0) || this.raise(r, "Invalid Unicode escape"), t += _(a), s = this.state.pos;
						}e = !1;
					}return t + this.input.slice(s, this.state.pos);
				}, i.readWord = function () {
					var t = this.readWord1(),
					    e = h.name;this.isKeyword(t) && (this.state.containsEsc && this.raise(this.state.pos, 'Escape sequence in keyword ' + t), e = p[t]), this.finishToken(e, t);
				}, i.braceIsBlock = function (t) {
					if (t === h.colon) {
						var e = this.curContext();if (e === E.braceStatement || e === E.braceExpression) return !e.isExpr;
					}return t === h._return ? T.test(this.input.slice(this.state.lastTokEnd, this.state.start)) : t === h._else || t === h.semi || t === h.eof || t === h.parenR || (t === h.braceL ? this.curContext() === E.braceStatement : t === h.relational || !this.state.exprAllowed);
				}, i.updateContext = function (t) {
					var e,
					    s = this.state.type;!s.keyword || t !== h.dot && t !== h.questionDot ? (e = s.updateContext) ? e.call(this, t) : this.state.exprAllowed = s.beforeExpr : this.state.exprAllowed = !1;
				}, e;
			}(I)),
			    F = ["leadingComments", "trailingComments", "innerComments"],
			    B = function () {
				function t(t, e, s) {
					this.type = "", this.start = e, this.end = 0, this.loc = new S(s), t && t.options.ranges && (this.range = [e, 0]), t && t.filename && (this.loc.filename = t.filename);
				}return t.prototype.__clone = function () {
					var e = this,
					    s = new t();return Object.keys(this).forEach(function (t) {
						F.indexOf(t) < 0 && (s[t] = e[t]);
					}), s;
				}, t;
			}(),
			    q = [],
			    V = { kind: "loop" },
			    U = { kind: "switch" },
			    K = {},
			    W = function (t) {
				function e(e, s) {
					var r;return e = function (t) {
						var e = {};for (var s in i) {
							e[s] = t && null != t[s] ? t[s] : i[s];
						}return e;
					}(e), (r = t.call(this, e, s) || this).options = e, r.inModule = "module" === r.options.sourceType, r.input = s, r.plugins = function (t) {
						for (var e = {}, s = 0; s < t.length; s++) {
							var i = t[s];e[i] = !0;
						}return e;
					}(r.options.plugins), r.filename = e.sourceFilename, 0 === r.state.pos && "#" === r.input[0] && "!" === r.input[1] && r.skipLineComment(2), r;
				}return s(e, t), e.prototype.parse = function () {
					var t = this.startNode(),
					    e = this.startNode();return this.nextToken(), this.parseTopLevel(t, e);
				}, e;
			}(function (t) {
				function e() {
					return t.apply(this, arguments) || this;
				}s(e, t);var i = e.prototype;return i.parseTopLevel = function (t, e) {
					return e.sourceType = this.options.sourceType, this.parseBlockBody(e, !0, !0, h.eof), t.program = this.finishNode(e, "Program"), t.comments = this.state.comments, this.options.tokens && (t.tokens = this.state.tokens), this.finishNode(t, "File");
				}, i.stmtToDirective = function (t) {
					var e = t.expression,
					    s = this.startNodeAt(e.start, e.loc.start),
					    i = this.startNodeAt(t.start, t.loc.start),
					    r = this.input.slice(e.start, e.end),
					    a = s.value = r.slice(1, -1);return this.addExtra(s, "raw", r), this.addExtra(s, "rawValue", a), i.value = this.finishNodeAt(s, "DirectiveLiteral", e.end, e.loc.end), this.finishNodeAt(i, "Directive", t.end, t.loc.end);
				}, i.parseStatement = function (t, e) {
					return this.match(h.at) && this.parseDecorators(!0), this.parseStatementContent(t, e);
				}, i.parseStatementContent = function (t, e) {
					var s = this.state.type,
					    i = this.startNode();switch (s) {case h._break:case h._continue:
							return this.parseBreakContinueStatement(i, s.keyword);case h._debugger:
							return this.parseDebuggerStatement(i);case h._do:
							return this.parseDoStatement(i);case h._for:
							return this.parseForStatement(i);case h._function:
							if (this.lookahead().type === h.dot) break;return t || this.unexpected(), this.parseFunctionStatement(i);case h._class:
							return t || this.unexpected(), this.parseClass(i, !0);case h._if:
							return this.parseIfStatement(i);case h._return:
							return this.parseReturnStatement(i);case h._switch:
							return this.parseSwitchStatement(i);case h._throw:
							return this.parseThrowStatement(i);case h._try:
							return this.parseTryStatement(i);case h._let:case h._const:
							t || this.unexpected();case h._var:
							return this.parseVarStatement(i, s);case h._while:
							return this.parseWhileStatement(i);case h._with:
							return this.parseWithStatement(i);case h.braceL:
							return this.parseBlock();case h.semi:
							return this.parseEmptyStatement(i);case h._export:case h._import:
							if (this.hasPlugin("dynamicImport") && this.lookahead().type === h.parenL || this.hasPlugin("importMeta") && this.lookahead().type === h.dot) break;var r;return this.options.allowImportExportEverywhere || e || this.raise(this.state.start, "'import' and 'export' may only appear at the top level"), this.next(), r = s == h._import ? this.parseImport(i) : this.parseExport(i), this.assertModuleNodeAllowed(i), r;case h.name:
							if ("async" === this.state.value) {
								var a = this.state.clone();if (this.next(), this.match(h._function) && !this.canInsertSemicolon()) return this.expect(h._function), this.parseFunction(i, !0, !1, !0);this.state = a;
							}}var n = this.state.value,
					    o = this.parseExpression();return s === h.name && "Identifier" === o.type && this.eat(h.colon) ? this.parseLabeledStatement(i, n, o) : this.parseExpressionStatement(i, o);
				}, i.assertModuleNodeAllowed = function (t) {
					this.options.allowImportExportEverywhere || this.inModule || this.raise(t.start, "'import' and 'export' may appear only with 'sourceType: \"module\"'");
				}, i.takeDecorators = function (t) {
					var e = this.state.decoratorStack[this.state.decoratorStack.length - 1];e.length && (t.decorators = e, this.resetStartLocationFromNode(t, e[0]), this.state.decoratorStack[this.state.decoratorStack.length - 1] = []);
				}, i.parseDecorators = function (t) {
					this.hasPlugin("decorators2") && (t = !1);for (var e = this.state.decoratorStack[this.state.decoratorStack.length - 1]; this.match(h.at);) {
						var s = this.parseDecorator();e.push(s);
					}if (this.match(h._export)) {
						if (t) return;this.raise(this.state.start, "Using the export keyword between a decorator and a class is not allowed. Please use `export @dec class` instead");
					}this.match(h._class) || this.raise(this.state.start, "Leading decorators must be attached to a class declaration");
				}, i.parseDecorator = function () {
					this.expectOnePlugin(["decorators", "decorators2"]);var t = this.startNode();if (this.next(), this.hasPlugin("decorators2")) {
						for (var e = this.state.start, s = this.state.startLoc, i = this.parseIdentifier(!1); this.eat(h.dot);) {
							var r = this.startNodeAt(e, s);r.object = i, r.property = this.parseIdentifier(!0), r.computed = !1, i = this.finishNode(r, "MemberExpression");
						}if (this.eat(h.parenL)) {
							var a = this.startNodeAt(e, s);a.callee = i, this.state.decoratorStack.push([]), a.arguments = this.parseCallExpressionArguments(h.parenR, !1), this.state.decoratorStack.pop(), i = this.finishNode(a, "CallExpression"), this.toReferencedList(i.arguments);
						}t.expression = i;
					} else t.expression = this.parseMaybeAssign();return this.finishNode(t, "Decorator");
				}, i.parseBreakContinueStatement = function (t, e) {
					var s,
					    i = "break" === e;for (this.next(), this.isLineTerminator() ? t.label = null : this.match(h.name) ? (t.label = this.parseIdentifier(), this.semicolon()) : this.unexpected(), s = 0; s < this.state.labels.length; ++s) {
						var r = this.state.labels[s];if (null == t.label || r.name === t.label.name) {
							if (null != r.kind && (i || "loop" === r.kind)) break;if (t.label && i) break;
						}
					}return s === this.state.labels.length && this.raise(t.start, "Unsyntactic " + e), this.finishNode(t, i ? "BreakStatement" : "ContinueStatement");
				}, i.parseDebuggerStatement = function (t) {
					return this.next(), this.semicolon(), this.finishNode(t, "DebuggerStatement");
				}, i.parseDoStatement = function (t) {
					return this.next(), this.state.labels.push(V), t.body = this.parseStatement(!1), this.state.labels.pop(), this.expect(h._while), t.test = this.parseParenExpression(), this.eat(h.semi), this.finishNode(t, "DoWhileStatement");
				}, i.parseForStatement = function (t) {
					this.next(), this.state.labels.push(V);var e = !1;if (this.state.inAsync && this.isContextual("await") && (this.expectPlugin("asyncGenerators"), e = !0, this.next()), this.expect(h.parenL), this.match(h.semi)) return e && this.unexpected(), this.parseFor(t, null);if (this.match(h._var) || this.match(h._let) || this.match(h._const)) {
						var s = this.startNode(),
						    i = this.state.type;return this.next(), this.parseVar(s, !0, i), this.finishNode(s, "VariableDeclaration"), !this.match(h._in) && !this.isContextual("of") || 1 !== s.declarations.length || s.declarations[0].init ? (e && this.unexpected(), this.parseFor(t, s)) : this.parseForIn(t, s, e);
					}var r = { start: 0 },
					    a = this.parseExpression(!0, r);if (this.match(h._in) || this.isContextual("of")) {
						var n = this.isContextual("of") ? "for-of statement" : "for-in statement";return this.toAssignable(a, void 0, n), this.checkLVal(a, void 0, void 0, n), this.parseForIn(t, a, e);
					}return r.start && this.unexpected(r.start), e && this.unexpected(), this.parseFor(t, a);
				}, i.parseFunctionStatement = function (t) {
					return this.next(), this.parseFunction(t, !0);
				}, i.parseIfStatement = function (t) {
					return this.next(), t.test = this.parseParenExpression(), t.consequent = this.parseStatement(!1), t.alternate = this.eat(h._else) ? this.parseStatement(!1) : null, this.finishNode(t, "IfStatement");
				}, i.parseReturnStatement = function (t) {
					return this.state.inFunction || this.options.allowReturnOutsideFunction || this.raise(this.state.start, "'return' outside of function"), this.next(), this.isLineTerminator() ? t.argument = null : (t.argument = this.parseExpression(), this.semicolon()), this.finishNode(t, "ReturnStatement");
				}, i.parseSwitchStatement = function (t) {
					this.next(), t.discriminant = this.parseParenExpression();var e,
					    s,
					    i = t.cases = [];for (this.expect(h.braceL), this.state.labels.push(U); !this.match(h.braceR);) {
						if (this.match(h._case) || this.match(h._default)) {
							var r = this.match(h._case);e && this.finishNode(e, "SwitchCase"), i.push(e = this.startNode()), e.consequent = [], this.next(), r ? e.test = this.parseExpression() : (s && this.raise(this.state.lastTokStart, "Multiple default clauses"), s = !0, e.test = null), this.expect(h.colon);
						} else e ? e.consequent.push(this.parseStatement(!0)) : this.unexpected();
					}return e && this.finishNode(e, "SwitchCase"), this.next(), this.state.labels.pop(), this.finishNode(t, "SwitchStatement");
				}, i.parseThrowStatement = function (t) {
					return this.next(), T.test(this.input.slice(this.state.lastTokEnd, this.state.start)) && this.raise(this.state.lastTokEnd, "Illegal newline after throw"), t.argument = this.parseExpression(), this.semicolon(), this.finishNode(t, "ThrowStatement");
				}, i.parseTryStatement = function (t) {
					if (this.next(), t.block = this.parseBlock(), t.handler = null, this.match(h._catch)) {
						var e = this.startNode();if (this.next(), this.match(h.parenL)) {
							this.expect(h.parenL), e.param = this.parseBindingAtom();var s = Object.create(null);this.checkLVal(e.param, !0, s, "catch clause"), this.expect(h.parenR);
						} else this.expectPlugin("optionalCatchBinding"), e.param = null;e.body = this.parseBlock(), t.handler = this.finishNode(e, "CatchClause");
					}return t.guardedHandlers = q, t.finalizer = this.eat(h._finally) ? this.parseBlock() : null, t.handler || t.finalizer || this.raise(t.start, "Missing catch or finally clause"), this.finishNode(t, "TryStatement");
				}, i.parseVarStatement = function (t, e) {
					return this.next(), this.parseVar(t, !1, e), this.semicolon(), this.finishNode(t, "VariableDeclaration");
				}, i.parseWhileStatement = function (t) {
					return this.next(), t.test = this.parseParenExpression(), this.state.labels.push(V), t.body = this.parseStatement(!1), this.state.labels.pop(), this.finishNode(t, "WhileStatement");
				}, i.parseWithStatement = function (t) {
					return this.state.strict && this.raise(this.state.start, "'with' in strict mode"), this.next(), t.object = this.parseParenExpression(), t.body = this.parseStatement(!1), this.finishNode(t, "WithStatement");
				}, i.parseEmptyStatement = function (t) {
					return this.next(), this.finishNode(t, "EmptyStatement");
				}, i.parseLabeledStatement = function (t, e, s) {
					for (var i = 0, r = this.state.labels; i < r.length; i++) {
						r[i].name === e && this.raise(s.start, 'Label \'' + e + '\' is already declared');
					}for (var a = this.state.type.isLoop ? "loop" : this.match(h._switch) ? "switch" : null, n = this.state.labels.length - 1; n >= 0; n--) {
						var o = this.state.labels[n];if (o.statementStart !== t.start) break;o.statementStart = this.state.start, o.kind = a;
					}return this.state.labels.push({ name: e, kind: a, statementStart: this.state.start }), t.body = this.parseStatement(!0), ("ClassDeclaration" == t.body.type || "VariableDeclaration" == t.body.type && "var" !== t.body.kind || "FunctionDeclaration" == t.body.type && (this.state.strict || t.body.generator || t.body.async)) && this.raise(t.body.start, "Invalid labeled declaration"), this.state.labels.pop(), t.label = s, this.finishNode(t, "LabeledStatement");
				}, i.parseExpressionStatement = function (t, e) {
					return t.expression = e, this.semicolon(), this.finishNode(t, "ExpressionStatement");
				}, i.parseBlock = function (t) {
					var e = this.startNode();return this.expect(h.braceL), this.parseBlockBody(e, t, !1, h.braceR), this.finishNode(e, "BlockStatement");
				}, i.isValidDirective = function (t) {
					return "ExpressionStatement" === t.type && "StringLiteral" === t.expression.type && !t.expression.extra.parenthesized;
				}, i.parseBlockBody = function (t, e, s, i) {
					var r = t.body = [],
					    a = t.directives = [];this.parseBlockOrModuleBlockBody(r, e ? a : void 0, s, i);
				}, i.parseBlockOrModuleBlockBody = function (t, e, s, i) {
					for (var r, a, n = !1; !this.eat(i);) {
						n || !this.state.containsOctal || a || (a = this.state.octalPosition);var o = this.parseStatement(!0, s);if (e && !n && this.isValidDirective(o)) {
							var h = this.stmtToDirective(o);e.push(h), void 0 === r && "use strict" === h.value.value && (r = this.state.strict, this.setStrict(!0), a && this.raise(a, "Octal literal in strict mode"));
						} else n = !0, t.push(o);
					}!1 === r && this.setStrict(!1);
				}, i.parseFor = function (t, e) {
					return t.init = e, this.expect(h.semi), t.test = this.match(h.semi) ? null : this.parseExpression(), this.expect(h.semi), t.update = this.match(h.parenR) ? null : this.parseExpression(), this.expect(h.parenR), t.body = this.parseStatement(!1), this.state.labels.pop(), this.finishNode(t, "ForStatement");
				}, i.parseForIn = function (t, e, s) {
					var i = this.match(h._in) ? "ForInStatement" : "ForOfStatement";return s ? this.eatContextual("of") : this.next(), "ForOfStatement" === i && (t.await = !!s), t.left = e, t.right = this.parseExpression(), this.expect(h.parenR), t.body = this.parseStatement(!1), this.state.labels.pop(), this.finishNode(t, i);
				}, i.parseVar = function (t, e, s) {
					var i = t.declarations = [];for (t.kind = s.keyword;;) {
						var r = this.startNode();if (this.parseVarHead(r), this.eat(h.eq) ? r.init = this.parseMaybeAssign(e) : (s !== h._const || this.match(h._in) || this.isContextual("of") ? "Identifier" === r.id.type || e && (this.match(h._in) || this.isContextual("of")) || this.raise(this.state.lastTokEnd, "Complex binding patterns require an initialization value") : this.hasPlugin("typescript") || this.unexpected(), r.init = null), i.push(this.finishNode(r, "VariableDeclarator")), !this.eat(h.comma)) break;
					}return t;
				}, i.parseVarHead = function (t) {
					t.id = this.parseBindingAtom(), this.checkLVal(t.id, !0, void 0, "variable declaration");
				}, i.parseFunction = function (t, e, s, i, r) {
					var a = this.state.inFunction,
					    n = this.state.inMethod,
					    o = this.state.inGenerator;return this.state.inFunction = !0, this.state.inMethod = !1, this.initFunction(t, i), this.match(h.star) && (t.async && this.expectPlugin("asyncGenerators"), t.generator = !0, this.next()), !e || r || this.match(h.name) || this.match(h._yield) || this.unexpected(), e || (this.state.inGenerator = t.generator), (this.match(h.name) || this.match(h._yield)) && (t.id = this.parseBindingIdentifier()), e && (this.state.inGenerator = t.generator), this.parseFunctionParams(t), this.parseFunctionBodyAndFinish(t, e ? "FunctionDeclaration" : "FunctionExpression", s), this.state.inFunction = a, this.state.inMethod = n, this.state.inGenerator = o, t;
				}, i.parseFunctionParams = function (t, e) {
					var s = this.state.inParameters;this.state.inParameters = !0, this.expect(h.parenL), t.params = this.parseBindingList(h.parenR, !1, e), this.state.inParameters = s;
				}, i.parseClass = function (t, e, s) {
					return this.next(), this.takeDecorators(t), this.parseClassId(t, e, s), this.parseClassSuper(t), this.parseClassBody(t), this.finishNode(t, e ? "ClassDeclaration" : "ClassExpression");
				}, i.isClassProperty = function () {
					return this.match(h.eq) || this.match(h.semi) || this.match(h.braceR);
				}, i.isClassMethod = function () {
					return this.match(h.parenL);
				}, i.isNonstaticConstructor = function (t) {
					return !(t.computed || t.static || "constructor" !== t.key.name && "constructor" !== t.key.value);
				}, i.parseClassBody = function (t) {
					var e = this.state.strict;this.state.strict = !0, this.state.classLevel++;var s = { hadConstructor: !1 },
					    i = [],
					    r = this.startNode();for (r.body = [], this.expect(h.braceL); !this.eat(h.braceR);) {
						if (this.eat(h.semi)) i.length > 0 && this.raise(this.state.lastTokEnd, "Decorators must not be followed by a semicolon");else if (this.match(h.at)) i.push(this.parseDecorator());else {
							var a = this.startNode();i.length && (a.decorators = i, this.resetStartLocationFromNode(a, i[0]), i = []), this.parseClassMember(r, a, s), this.hasPlugin("decorators2") && -1 === ["method", "get", "set"].indexOf(a.kind) && a.decorators && a.decorators.length > 0 && this.raise(a.start, "Stage 2 decorators may only be used with a class or a class method");
						}
					}i.length && this.raise(this.state.start, "You have trailing decorators with no method"), t.body = this.finishNode(r, "ClassBody"), this.state.classLevel--, this.state.strict = e;
				}, i.parseClassMember = function (t, e, s) {
					var i = !1;if (this.match(h.name) && "static" === this.state.value) {
						var r = this.parseIdentifier(!0);if (this.isClassMethod()) {
							var a = e;return a.kind = "method", a.computed = !1, a.key = r, a.static = !1, void this.pushClassMethod(t, a, !1, !1, !1);
						}if (this.isClassProperty()) {
							var n = e;return n.computed = !1, n.key = r, n.static = !1, void t.body.push(this.parseClassProperty(n));
						}i = !0;
					}this.parseClassMemberWithIsStatic(t, e, s, i);
				}, i.parseClassMemberWithIsStatic = function (t, e, s, i) {
					var r = e,
					    a = e,
					    n = e,
					    o = e,
					    p = r,
					    c = r;if (e.static = i, this.eat(h.star)) return p.kind = "method", this.parseClassPropertyName(p), "PrivateName" === p.key.type ? void this.pushClassPrivateMethod(t, a, !0, !1) : (this.isNonstaticConstructor(r) && this.raise(r.key.start, "Constructor can't be a generator"), void this.pushClassMethod(t, r, !0, !1, !1));var l = this.parseClassPropertyName(e),
					    u = "PrivateName" === l.type,
					    d = "Identifier" === l.type;if (this.parsePostMemberNameModifiers(c), this.isClassMethod()) {
						if (p.kind = "method", u) return void this.pushClassPrivateMethod(t, a, !1, !1);var f = this.isNonstaticConstructor(r);f && (r.kind = "constructor", r.decorators && this.raise(r.start, "You can't attach decorators to a class constructor"), s.hadConstructor && !this.hasPlugin("typescript") && this.raise(l.start, "Duplicate constructor in the same class"), s.hadConstructor = !0), this.pushClassMethod(t, r, !1, !1, f);
					} else if (this.isClassProperty()) u ? this.pushClassPrivateProperty(t, o) : this.pushClassProperty(t, n);else if (d && "async" === l.name && !this.isLineTerminator()) {
						var m = this.match(h.star);m && (this.expectPlugin("asyncGenerators"), this.next()), p.kind = "method", this.parseClassPropertyName(p), "PrivateName" === p.key.type ? this.pushClassPrivateMethod(t, a, m, !0) : (this.isNonstaticConstructor(r) && this.raise(r.key.start, "Constructor can't be an async function"), this.pushClassMethod(t, r, m, !0, !1));
					} else !d || "get" !== l.name && "set" !== l.name || this.isLineTerminator() && this.match(h.star) ? this.isLineTerminator() ? u ? this.pushClassPrivateProperty(t, o) : this.pushClassProperty(t, n) : this.unexpected() : (p.kind = l.name, this.parseClassPropertyName(r), "PrivateName" === p.key.type ? this.pushClassPrivateMethod(t, a, !1, !1) : (this.isNonstaticConstructor(r) && this.raise(r.key.start, "Constructor can't have get/set modifier"), this.pushClassMethod(t, r, !1, !1, !1)), this.checkGetterSetterParamCount(r));
				}, i.parseClassPropertyName = function (t) {
					var e = this.parsePropertyName(t);return t.computed || !t.static || "prototype" !== e.name && "prototype" !== e.value || this.raise(e.start, "Classes may not have static property named prototype"), "PrivateName" === e.type && "constructor" === e.id.name && this.raise(e.start, "Classes may not have a private field named '#constructor'"), e;
				}, i.pushClassProperty = function (t, e) {
					this.isNonstaticConstructor(e) && this.raise(e.key.start, "Classes may not have a non-static field named 'constructor'"), t.body.push(this.parseClassProperty(e));
				}, i.pushClassPrivateProperty = function (t, e) {
					this.expectPlugin("classPrivateProperties", e.key.start), t.body.push(this.parseClassPrivateProperty(e));
				}, i.pushClassMethod = function (t, e, s, i, r) {
					t.body.push(this.parseMethod(e, s, i, r, "ClassMethod"));
				}, i.pushClassPrivateMethod = function (t, e, s, i) {
					this.expectPlugin("classPrivateMethods", e.key.start), t.body.push(this.parseMethod(e, s, i, !1, "ClassPrivateMethod"));
				}, i.parsePostMemberNameModifiers = function (t) {}, i.parseAccessModifier = function () {}, i.parseClassPrivateProperty = function (t) {
					return this.state.inClassProperty = !0, t.value = this.eat(h.eq) ? this.parseMaybeAssign() : null, this.semicolon(), this.state.inClassProperty = !1, this.finishNode(t, "ClassPrivateProperty");
				}, i.parseClassProperty = function (t) {
					return t.typeAnnotation || this.expectPlugin("classProperties"), this.state.inClassProperty = !0, this.match(h.eq) ? (this.expectPlugin("classProperties"), this.next(), t.value = this.parseMaybeAssign()) : t.value = null, this.semicolon(), this.state.inClassProperty = !1, this.finishNode(t, "ClassProperty");
				}, i.parseClassId = function (t, e, s) {
					this.match(h.name) ? t.id = this.parseIdentifier() : s || !e ? t.id = null : this.unexpected(null, "A class name is required");
				}, i.parseClassSuper = function (t) {
					t.superClass = this.eat(h._extends) ? this.parseExprSubscripts() : null;
				}, i.parseExport = function (t) {
					if (this.shouldParseExportStar()) {
						if (this.parseExportStar(t), "ExportAllDeclaration" === t.type) return t;
					} else if (this.isExportDefaultSpecifier()) {
						this.expectPlugin("exportDefaultFrom");var e = this.startNode();e.exported = this.parseIdentifier(!0);var s = [this.finishNode(e, "ExportDefaultSpecifier")];if (t.specifiers = s, this.match(h.comma) && this.lookahead().type === h.star) {
							this.expect(h.comma);var i = this.startNode();this.expect(h.star), this.expectContextual("as"), i.exported = this.parseIdentifier(), s.push(this.finishNode(i, "ExportNamespaceSpecifier"));
						} else this.parseExportSpecifiersMaybe(t);this.parseExportFrom(t, !0);
					} else {
						if (this.eat(h._default)) {
							var r = this.startNode(),
							    a = !1;return this.eat(h._function) ? r = this.parseFunction(r, !0, !1, !1, !0) : this.isContextual("async") && this.lookahead().type === h._function ? (this.eatContextual("async"), this.eat(h._function), r = this.parseFunction(r, !0, !1, !0, !0)) : this.match(h._class) ? r = this.parseClass(r, !0, !0) : (a = !0, r = this.parseMaybeAssign()), t.declaration = r, a && this.semicolon(), this.checkExport(t, !0, !0), this.finishNode(t, "ExportDefaultDeclaration");
						}if (this.shouldParseExportDeclaration()) {
							if (this.isContextual("async")) {
								var n = this.lookahead();n.type !== h._function && this.unexpected(n.start, 'Unexpected token, expected "function"');
							}t.specifiers = [], t.source = null, t.declaration = this.parseExportDeclaration(t);
						} else t.declaration = null, t.specifiers = this.parseExportSpecifiers(), this.parseExportFrom(t);
					}return this.checkExport(t, !0), this.finishNode(t, "ExportNamedDeclaration");
				}, i.parseExportDeclaration = function (t) {
					return this.parseStatement(!0);
				}, i.isExportDefaultSpecifier = function () {
					if (this.match(h.name)) return "async" !== this.state.value;if (!this.match(h._default)) return !1;var t = this.lookahead();return t.type === h.comma || t.type === h.name && "from" === t.value;
				}, i.parseExportSpecifiersMaybe = function (t) {
					this.eat(h.comma) && (t.specifiers = t.specifiers.concat(this.parseExportSpecifiers()));
				}, i.parseExportFrom = function (t, e) {
					this.eatContextual("from") ? (t.source = this.match(h.string) ? this.parseExprAtom() : this.unexpected(), this.checkExport(t)) : e ? this.unexpected() : t.source = null, this.semicolon();
				}, i.shouldParseExportStar = function () {
					return this.match(h.star);
				}, i.parseExportStar = function (t) {
					this.expect(h.star), this.isContextual("as") ? this.parseExportNamespace(t) : (this.parseExportFrom(t, !0), this.finishNode(t, "ExportAllDeclaration"));
				}, i.parseExportNamespace = function (t) {
					this.expectPlugin("exportNamespaceFrom");var e = this.startNodeAt(this.state.lastTokStart, this.state.lastTokStartLoc);this.next(), e.exported = this.parseIdentifier(!0), t.specifiers = [this.finishNode(e, "ExportNamespaceSpecifier")], this.parseExportSpecifiersMaybe(t), this.parseExportFrom(t, !0);
				}, i.shouldParseExportDeclaration = function () {
					return "var" === this.state.type.keyword || "const" === this.state.type.keyword || "let" === this.state.type.keyword || "function" === this.state.type.keyword || "class" === this.state.type.keyword || this.isContextual("async") || this.match(h.at) && this.expectPlugin("decorators2");
				}, i.checkExport = function (t, e, s) {
					if (e) if (s) this.checkDuplicateExports(t, "default");else if (t.specifiers && t.specifiers.length) for (var i = 0, r = t.specifiers; i < r.length; i++) {
						var a = r[i];this.checkDuplicateExports(a, a.exported.name);
					} else if (t.declaration) if ("FunctionDeclaration" === t.declaration.type || "ClassDeclaration" === t.declaration.type) this.checkDuplicateExports(t, t.declaration.id.name);else if ("VariableDeclaration" === t.declaration.type) for (var n = 0, o = t.declaration.declarations; n < o.length; n++) {
						var h = o[n];this.checkDeclaration(h.id);
					}if (this.state.decoratorStack[this.state.decoratorStack.length - 1].length) {
						var p = t.declaration && ("ClassDeclaration" === t.declaration.type || "ClassExpression" === t.declaration.type);if (!t.declaration || !p) throw this.raise(t.start, "You can only use decorators on an export when exporting a class");this.takeDecorators(t.declaration);
					}
				}, i.checkDeclaration = function (t) {
					if ("ObjectPattern" === t.type) for (var e = 0, s = t.properties; e < s.length; e++) {
						var i = s[e];this.checkDeclaration(i);
					} else if ("ArrayPattern" === t.type) for (var r = 0, a = t.elements; r < a.length; r++) {
						var n = a[r];n && this.checkDeclaration(n);
					} else "ObjectProperty" === t.type ? this.checkDeclaration(t.value) : "RestElement" === t.type ? this.checkDeclaration(t.argument) : "Identifier" === t.type && this.checkDuplicateExports(t, t.name);
				}, i.checkDuplicateExports = function (t, e) {
					this.state.exportedIdentifiers.indexOf(e) > -1 && this.raiseDuplicateExportError(t, e), this.state.exportedIdentifiers.push(e);
				}, i.raiseDuplicateExportError = function (t, e) {
					throw this.raise(t.start, "default" === e ? "Only one default export allowed per module." : '`' + e + '` has already been exported. Exported identifiers must be unique.');
				}, i.parseExportSpecifiers = function () {
					var t,
					    e = [],
					    s = !0;for (this.expect(h.braceL); !this.eat(h.braceR);) {
						if (s) s = !1;else if (this.expect(h.comma), this.eat(h.braceR)) break;var i = this.match(h._default);i && !t && (t = !0);var r = this.startNode();r.local = this.parseIdentifier(i), r.exported = this.eatContextual("as") ? this.parseIdentifier(!0) : r.local.__clone(), e.push(this.finishNode(r, "ExportSpecifier"));
					}return t && !this.isContextual("from") && this.unexpected(), e;
				}, i.parseImport = function (t) {
					return this.match(h.string) ? (t.specifiers = [], t.source = this.parseExprAtom()) : (t.specifiers = [], this.parseImportSpecifiers(t), this.expectContextual("from"), t.source = this.match(h.string) ? this.parseExprAtom() : this.unexpected()), this.semicolon(), this.finishNode(t, "ImportDeclaration");
				}, i.shouldParseDefaultImport = function (t) {
					return this.match(h.name);
				}, i.parseImportSpecifierLocal = function (t, e, s, i) {
					e.local = this.parseIdentifier(), this.checkLVal(e.local, !0, void 0, i), t.specifiers.push(this.finishNode(e, s));
				}, i.parseImportSpecifiers = function (t) {
					var e = !0;if (!this.shouldParseDefaultImport(t) || (this.parseImportSpecifierLocal(t, this.startNode(), "ImportDefaultSpecifier", "default import specifier"), this.eat(h.comma))) {
						if (this.match(h.star)) {
							var s = this.startNode();return this.next(), this.expectContextual("as"), void this.parseImportSpecifierLocal(t, s, "ImportNamespaceSpecifier", "import namespace specifier");
						}for (this.expect(h.braceL); !this.eat(h.braceR);) {
							if (e) e = !1;else if (this.eat(h.colon) && this.unexpected(null, "ES2015 named imports do not destructure. Use another statement for destructuring after the import."), this.expect(h.comma), this.eat(h.braceR)) break;this.parseImportSpecifier(t);
						}
					}
				}, i.parseImportSpecifier = function (t) {
					var e = this.startNode();e.imported = this.parseIdentifier(!0), this.eatContextual("as") ? e.local = this.parseIdentifier() : (this.checkReservedWord(e.imported.name, e.start, !0, !0), e.local = e.imported.__clone()), this.checkLVal(e.local, !0, void 0, "import specifier"), t.specifiers.push(this.finishNode(e, "ImportSpecifier"));
				}, e;
			}(function (t) {
				function e() {
					return t.apply(this, arguments) || this;
				}s(e, t);var i = e.prototype;return i.checkPropClash = function (t, e) {
					if (!t.computed && !t.kind) {
						var s = t.key;"__proto__" === ("Identifier" === s.type ? s.name : String(s.value)) && (e.proto && this.raise(s.start, "Redefinition of __proto__ property"), e.proto = !0);
					}
				}, i.getExpression = function () {
					this.nextToken();var t = this.parseExpression();return this.match(h.eof) || this.unexpected(), t.comments = this.state.comments, t;
				}, i.parseExpression = function (t, e) {
					var s = this.state.start,
					    i = this.state.startLoc,
					    r = this.parseMaybeAssign(t, e);if (this.match(h.comma)) {
						var a = this.startNodeAt(s, i);for (a.expressions = [r]; this.eat(h.comma);) {
							a.expressions.push(this.parseMaybeAssign(t, e));
						}return this.toReferencedList(a.expressions), this.finishNode(a, "SequenceExpression");
					}return r;
				}, i.parseMaybeAssign = function (t, e, s, i) {
					var r,
					    a = this.state.start,
					    n = this.state.startLoc;if (this.match(h._yield) && this.state.inGenerator) {
						var o = this.parseYield();return s && (o = s.call(this, o, a, n)), o;
					}e ? r = !1 : (e = { start: 0 }, r = !0), (this.match(h.parenL) || this.match(h.name) || this.match(h._yield)) && (this.state.potentialArrowAt = this.state.start);var p = this.parseMaybeConditional(t, e, i);if (s && (p = s.call(this, p, a, n)), this.state.type.isAssign) {
						var c,
						    l = this.startNodeAt(a, n);if (l.operator = this.state.value, l.left = this.match(h.eq) ? this.toAssignable(p, void 0, "assignment expression") : p, e.start = 0, this.checkLVal(p, void 0, void 0, "assignment expression"), p.extra && p.extra.parenthesized) "ObjectPattern" === p.type ? c = "`({a}) = 0` use `({a} = 0)`" : "ArrayPattern" === p.type && (c = "`([a]) = 0` use `([a] = 0)`"), c && this.raise(p.start, 'You\'re trying to assign to a parenthesized expression, eg. instead of ' + c);return this.next(), l.right = this.parseMaybeAssign(t), this.finishNode(l, "AssignmentExpression");
					}return r && e.start && this.unexpected(e.start), p;
				}, i.parseMaybeConditional = function (t, e, s) {
					var i = this.state.start,
					    r = this.state.startLoc,
					    a = this.state.potentialArrowAt,
					    n = this.parseExprOps(t, e);return "ArrowFunctionExpression" === n.type && n.start === a ? n : e && e.start ? n : this.parseConditional(n, t, i, r, s);
				}, i.parseConditional = function (t, e, s, i, r) {
					if (this.eat(h.question)) {
						var a = this.startNodeAt(s, i);return a.test = t, a.consequent = this.parseMaybeAssign(), this.expect(h.colon), a.alternate = this.parseMaybeAssign(e), this.finishNode(a, "ConditionalExpression");
					}return t;
				}, i.parseExprOps = function (t, e) {
					var s = this.state.start,
					    i = this.state.startLoc,
					    r = this.state.potentialArrowAt,
					    a = this.parseMaybeUnary(e);return "ArrowFunctionExpression" === a.type && a.start === r ? a : e && e.start ? a : this.parseExprOp(a, s, i, -1, t);
				}, i.parseExprOp = function (t, e, s, i, r) {
					var a = this.state.type.binop;if (!(null == a || r && this.match(h._in)) && a > i) {
						var n = this.startNodeAt(e, s);n.left = t, n.operator = this.state.value, "**" !== n.operator || "UnaryExpression" !== t.type || !t.extra || t.extra.parenthesizedArgument || t.extra.parenthesized || this.raise(t.argument.start, "Illegal expression. Wrap left hand side or entire exponentiation in parentheses.");var o = this.state.type;this.next();var p = this.state.start,
						    c = this.state.startLoc;return "|>" === n.operator && (this.expectPlugin("pipelineOperator"), this.state.potentialArrowAt = p), "??" === n.operator && this.expectPlugin("nullishCoalescingOperator"), n.right = this.parseExprOp(this.parseMaybeUnary(), p, c, o.rightAssociative ? a - 1 : a, r), this.finishNode(n, o === h.logicalOR || o === h.logicalAND || o === h.nullishCoalescing ? "LogicalExpression" : "BinaryExpression"), this.parseExprOp(n, e, s, i, r);
					}return t;
				}, i.parseMaybeUnary = function (t) {
					if (this.state.type.prefix) {
						var e = this.startNode(),
						    s = this.match(h.incDec);e.operator = this.state.value, e.prefix = !0, "throw" === e.operator && this.expectPlugin("throwExpressions"), this.next();var i = this.state.type;if (e.argument = this.parseMaybeUnary(), this.addExtra(e, "parenthesizedArgument", !(i !== h.parenL || e.argument.extra && e.argument.extra.parenthesized)), t && t.start && this.unexpected(t.start), s) this.checkLVal(e.argument, void 0, void 0, "prefix operation");else if (this.state.strict && "delete" === e.operator) {
							var r = e.argument;"Identifier" === r.type ? this.raise(e.start, "Deleting local variable in strict mode") : "MemberExpression" === r.type && "PrivateName" === r.property.type && this.raise(e.start, "Deleting a private field is not allowed");
						}return this.finishNode(e, s ? "UpdateExpression" : "UnaryExpression");
					}var a = this.state.start,
					    n = this.state.startLoc,
					    o = this.parseExprSubscripts(t);if (t && t.start) return o;for (; this.state.type.postfix && !this.canInsertSemicolon();) {
						var p = this.startNodeAt(a, n);p.operator = this.state.value, p.prefix = !1, p.argument = o, this.checkLVal(o, void 0, void 0, "postfix operation"), this.next(), o = this.finishNode(p, "UpdateExpression");
					}return o;
				}, i.parseExprSubscripts = function (t) {
					var e = this.state.start,
					    s = this.state.startLoc,
					    i = this.state.potentialArrowAt,
					    r = this.parseExprAtom(t);return "ArrowFunctionExpression" === r.type && r.start === i ? r : t && t.start ? r : this.parseSubscripts(r, e, s);
				}, i.parseSubscripts = function (t, e, s, i) {
					var r = { stop: !1 };do {
						t = this.parseSubscript(t, e, s, i, r);
					} while (!r.stop);return t;
				}, i.parseSubscript = function (t, e, s, i, r) {
					if (!i && this.eat(h.doubleColon)) {
						var a = this.startNodeAt(e, s);return a.object = t, a.callee = this.parseNoCallExpr(), r.stop = !0, this.parseSubscripts(this.finishNode(a, "BindExpression"), e, s, i);
					}if (this.match(h.questionDot)) {
						if (this.expectPlugin("optionalChaining"), i && this.lookahead().type == h.parenL) return r.stop = !0, t;this.next();var n = this.startNodeAt(e, s);if (this.eat(h.bracketL)) return n.object = t, n.property = this.parseExpression(), n.computed = !0, n.optional = !0, this.expect(h.bracketR), this.finishNode(n, "MemberExpression");if (this.eat(h.parenL)) {
							var o = this.atPossibleAsync(t);return n.callee = t, n.arguments = this.parseCallExpressionArguments(h.parenR, o), n.optional = !0, this.finishNode(n, "CallExpression");
						}return n.object = t, n.property = this.parseIdentifier(!0), n.computed = !1, n.optional = !0, this.finishNode(n, "MemberExpression");
					}if (this.eat(h.dot)) {
						var p = this.startNodeAt(e, s);return p.object = t, p.property = this.parseMaybePrivateName(), p.computed = !1, this.finishNode(p, "MemberExpression");
					}if (this.eat(h.bracketL)) {
						var c = this.startNodeAt(e, s);return c.object = t, c.property = this.parseExpression(), c.computed = !0, this.expect(h.bracketR), this.finishNode(c, "MemberExpression");
					}if (!i && this.match(h.parenL)) {
						var l = this.atPossibleAsync(t);this.next();var u = this.startNodeAt(e, s);u.callee = t;var d = { start: -1 };return u.arguments = this.parseCallExpressionArguments(h.parenR, l, d), this.finishCallExpression(u), l && this.shouldParseAsyncArrow() ? (r.stop = !0, d.start > -1 && this.raise(d.start, "A trailing comma is not permitted after the rest element"), this.parseAsyncArrowFromCallExpression(this.startNodeAt(e, s), u)) : (this.toReferencedList(u.arguments), u);
					}if (this.match(h.backQuote)) {
						var f = this.startNodeAt(e, s);return f.tag = t, f.quasi = this.parseTemplate(!0), this.finishNode(f, "TaggedTemplateExpression");
					}return r.stop = !0, t;
				}, i.atPossibleAsync = function (t) {
					return this.state.potentialArrowAt === t.start && "Identifier" === t.type && "async" === t.name && !this.canInsertSemicolon();
				}, i.finishCallExpression = function (t) {
					if ("Import" === t.callee.type) {
						1 !== t.arguments.length && this.raise(t.start, "import() requires exactly one argument");var e = t.arguments[0];e && "SpreadElement" === e.type && this.raise(e.start, "... is not allowed in import()");
					}return this.finishNode(t, "CallExpression");
				}, i.parseCallExpressionArguments = function (t, e, s) {
					for (var i, r = [], a = !0; !this.eat(t);) {
						if (a) a = !1;else if (this.expect(h.comma), this.eat(t)) break;this.match(h.parenL) && !i && (i = this.state.start), r.push(this.parseExprListItem(!1, e ? { start: 0 } : void 0, e ? { start: 0 } : void 0, e ? s : void 0));
					}return e && i && this.shouldParseAsyncArrow() && this.unexpected(), r;
				}, i.shouldParseAsyncArrow = function () {
					return this.match(h.arrow);
				}, i.parseAsyncArrowFromCallExpression = function (t, e) {
					var s = this.state.yieldInPossibleArrowParameters;return this.state.yieldInPossibleArrowParameters = null, this.expect(h.arrow), this.parseArrowExpression(t, e.arguments, !0), this.state.yieldInPossibleArrowParameters = s, t;
				}, i.parseNoCallExpr = function () {
					var t = this.state.start,
					    e = this.state.startLoc;return this.parseSubscripts(this.parseExprAtom(), t, e, !0);
				}, i.parseExprAtom = function (t) {
					var e,
					    s = this.state.potentialArrowAt === this.state.start;switch (this.state.type) {case h._super:
							return this.state.inMethod || this.state.inClassProperty || this.options.allowSuperOutsideMethod || this.raise(this.state.start, "super is only allowed in object methods and classes"), e = this.startNode(), this.next(), this.match(h.parenL) || this.match(h.bracketL) || this.match(h.dot) || this.unexpected(), this.match(h.parenL) && "constructor" !== this.state.inMethod && !this.options.allowSuperOutsideMethod && this.raise(e.start, "super() is only valid inside a class constructor. Make sure the method name is spelled exactly as 'constructor'."), this.finishNode(e, "Super");case h._import:
							return this.lookahead().type === h.dot ? this.parseImportMetaProperty() : (this.expectPlugin("dynamicImport"), e = this.startNode(), this.next(), this.match(h.parenL) || this.unexpected(null, h.parenL), this.finishNode(e, "Import"));case h._this:
							return e = this.startNode(), this.next(), this.finishNode(e, "ThisExpression");case h._yield:
							this.state.inGenerator && this.unexpected();case h.name:
							e = this.startNode();var i = "await" === this.state.value && this.state.inAsync,
							    r = this.shouldAllowYieldIdentifier(),
							    a = this.parseIdentifier(i || r);if ("await" === a.name) {
								if (this.state.inAsync || this.inModule) return this.parseAwait(e);
							} else {
								if ("async" === a.name && this.match(h._function) && !this.canInsertSemicolon()) return this.next(), this.parseFunction(e, !1, !1, !0);if (s && "async" === a.name && this.match(h.name)) {
									var n = this.state.yieldInPossibleArrowParameters;this.state.yieldInPossibleArrowParameters = null;var o = [this.parseIdentifier()];return this.expect(h.arrow), this.parseArrowExpression(e, o, !0), this.state.yieldInPossibleArrowParameters = n, e;
								}
							}if (s && !this.canInsertSemicolon() && this.eat(h.arrow)) {
								var p = this.state.yieldInPossibleArrowParameters;return this.state.yieldInPossibleArrowParameters = null, this.parseArrowExpression(e, [a]), this.state.yieldInPossibleArrowParameters = p, e;
							}return a;case h._do:
							this.expectPlugin("doExpressions");var c = this.startNode();this.next();var l = this.state.inFunction,
							    u = this.state.labels;return this.state.labels = [], this.state.inFunction = !1, c.body = this.parseBlock(!1), this.state.inFunction = l, this.state.labels = u, this.finishNode(c, "DoExpression");case h.regexp:
							var d = this.state.value;return (e = this.parseLiteral(d.value, "RegExpLiteral")).pattern = d.pattern, e.flags = d.flags, e;case h.num:
							return this.parseLiteral(this.state.value, "NumericLiteral");case h.bigint:
							return this.parseLiteral(this.state.value, "BigIntLiteral");case h.string:
							return this.parseLiteral(this.state.value, "StringLiteral");case h._null:
							return e = this.startNode(), this.next(), this.finishNode(e, "NullLiteral");case h._true:case h._false:
							return this.parseBooleanLiteral();case h.parenL:
							return this.parseParenAndDistinguishExpression(s);case h.bracketL:
							return e = this.startNode(), this.next(), e.elements = this.parseExprList(h.bracketR, !0, t), this.toReferencedList(e.elements), this.finishNode(e, "ArrayExpression");case h.braceL:
							return this.parseObj(!1, t);case h._function:
							return this.parseFunctionExpression();case h.at:
							this.parseDecorators();case h._class:
							return e = this.startNode(), this.takeDecorators(e), this.parseClass(e, !1);case h._new:
							return this.parseNew();case h.backQuote:
							return this.parseTemplate(!1);case h.doubleColon:
							e = this.startNode(), this.next(), e.object = null;var f = e.callee = this.parseNoCallExpr();if ("MemberExpression" === f.type) return this.finishNode(e, "BindExpression");throw this.raise(f.start, "Binding should be performed on object property.");default:
							throw this.unexpected();}
				}, i.parseBooleanLiteral = function () {
					var t = this.startNode();return t.value = this.match(h._true), this.next(), this.finishNode(t, "BooleanLiteral");
				}, i.parseMaybePrivateName = function () {
					if (this.match(h.hash)) {
						this.expectOnePlugin(["classPrivateProperties", "classPrivateMethods"]);var t = this.startNode();return this.next(), t.id = this.parseIdentifier(!0), this.finishNode(t, "PrivateName");
					}return this.parseIdentifier(!0);
				}, i.parseFunctionExpression = function () {
					var t = this.startNode(),
					    e = this.parseIdentifier(!0);return this.state.inGenerator && this.eat(h.dot) ? this.parseMetaProperty(t, e, "sent") : this.parseFunction(t, !1);
				}, i.parseMetaProperty = function (t, e, s) {
					return t.meta = e, "function" === e.name && "sent" === s && (this.isContextual(s) ? this.expectPlugin("functionSent") : this.hasPlugin("functionSent") || this.unexpected()), t.property = this.parseIdentifier(!0), t.property.name !== s && this.raise(t.property.start, 'The only valid meta property for ' + e.name + ' is ' + e.name + '.' + s), this.finishNode(t, "MetaProperty");
				}, i.parseImportMetaProperty = function () {
					var t = this.startNode(),
					    e = this.parseIdentifier(!0);return this.expect(h.dot), "import" === e.name && (this.isContextual("meta") ? this.expectPlugin("importMeta") : this.hasPlugin("importMeta") || this.raise(e.start, "Dynamic imports require a parameter: import('a.js').then")), this.inModule || this.raise(e.start, "import.meta may appear only with 'sourceType: \"module\"'"), this.parseMetaProperty(t, e, "meta");
				}, i.parseLiteral = function (t, e, s, i) {
					s = s || this.state.start, i = i || this.state.startLoc;var r = this.startNodeAt(s, i);return this.addExtra(r, "rawValue", t), this.addExtra(r, "raw", this.input.slice(s, this.state.end)), r.value = t, this.next(), this.finishNode(r, e);
				}, i.parseParenExpression = function () {
					this.expect(h.parenL);var t = this.parseExpression();return this.expect(h.parenR), t;
				}, i.parseParenAndDistinguishExpression = function (t) {
					var e,
					    s = this.state.start,
					    i = this.state.startLoc;this.expect(h.parenL);var r = this.state.maybeInArrowParameters,
					    a = this.state.yieldInPossibleArrowParameters;this.state.maybeInArrowParameters = !0, this.state.yieldInPossibleArrowParameters = null;for (var n, o, p = this.state.start, c = this.state.startLoc, l = [], u = { start: 0 }, d = { start: 0 }, f = !0; !this.match(h.parenR);) {
						if (f) f = !1;else if (this.expect(h.comma, d.start || null), this.match(h.parenR)) {
							o = this.state.start;break;
						}if (this.match(h.ellipsis)) {
							var m = this.state.start,
							    y = this.state.startLoc;n = this.state.start, l.push(this.parseParenItem(this.parseRest(), m, y)), this.match(h.comma) && this.lookahead().type === h.parenR && this.raise(this.state.start, "A trailing comma is not permitted after the rest element");break;
						}l.push(this.parseMaybeAssign(!1, u, this.parseParenItem, d));
					}var x = this.state.start,
					    P = this.state.startLoc;this.expect(h.parenR), this.state.maybeInArrowParameters = r;var v = this.startNodeAt(s, i);if (t && this.shouldParseArrow() && (v = this.parseArrow(v))) {
						for (var g = 0; g < l.length; g++) {
							var b = l[g];b.extra && b.extra.parenthesized && this.unexpected(b.extra.parenStart);
						}return this.parseArrowExpression(v, l), this.state.yieldInPossibleArrowParameters = a, v;
					}return this.state.yieldInPossibleArrowParameters = a, l.length || this.unexpected(this.state.lastTokStart), o && this.unexpected(o), n && this.unexpected(n), u.start && this.unexpected(u.start), d.start && this.unexpected(d.start), l.length > 1 ? ((e = this.startNodeAt(p, c)).expressions = l, this.toReferencedList(e.expressions), this.finishNodeAt(e, "SequenceExpression", x, P)) : e = l[0], this.addExtra(e, "parenthesized", !0), this.addExtra(e, "parenStart", s), e;
				}, i.shouldParseArrow = function () {
					return !this.canInsertSemicolon();
				}, i.parseArrow = function (t) {
					if (this.eat(h.arrow)) return t;
				}, i.parseParenItem = function (t, e, s) {
					return t;
				}, i.parseNew = function () {
					var t = this.startNode(),
					    e = this.parseIdentifier(!0);if (this.eat(h.dot)) {
						var s = this.parseMetaProperty(t, e, "target");if (!this.state.inFunction && !this.state.inClassProperty) {
							var i = "new.target can only be used in functions";this.hasPlugin("classProperties") && (i += " or class properties"), this.raise(s.start, i);
						}return s;
					}return t.callee = this.parseNoCallExpr(), this.eat(h.questionDot) && (t.optional = !0), this.parseNewArguments(t), this.finishNode(t, "NewExpression");
				}, i.parseNewArguments = function (t) {
					if (this.eat(h.parenL)) {
						var e = this.parseExprList(h.parenR);this.toReferencedList(e), t.arguments = e;
					} else t.arguments = [];
				}, i.parseTemplateElement = function (t) {
					var e = this.startNode();return null === this.state.value && (t ? this.state.invalidTemplateEscapePosition = null : this.raise(this.state.invalidTemplateEscapePosition || 0, "Invalid escape sequence in template")), e.value = { raw: this.input.slice(this.state.start, this.state.end).replace(/\r\n?/g, "\n"), cooked: this.state.value }, this.next(), e.tail = this.match(h.backQuote), this.finishNode(e, "TemplateElement");
				}, i.parseTemplate = function (t) {
					var e = this.startNode();this.next(), e.expressions = [];var s = this.parseTemplateElement(t);for (e.quasis = [s]; !s.tail;) {
						this.expect(h.dollarBraceL), e.expressions.push(this.parseExpression()), this.expect(h.braceR), e.quasis.push(s = this.parseTemplateElement(t));
					}return this.next(), this.finishNode(e, "TemplateLiteral");
				}, i.parseObj = function (t, e) {
					var s = [],
					    i = Object.create(null),
					    r = !0,
					    a = this.startNode();a.properties = [], this.next();for (var n = null; !this.eat(h.braceR);) {
						if (r) r = !1;else if (this.expect(h.comma), this.eat(h.braceR)) break;if (this.match(h.at)) if (this.hasPlugin("decorators2")) this.raise(this.state.start, "Stage 2 decorators disallow object literal property decorators");else for (; this.match(h.at);) {
							s.push(this.parseDecorator());
						}var o = this.startNode(),
						    p = !1,
						    c = !1,
						    l = void 0,
						    u = void 0;if (s.length && (o.decorators = s, s = []), this.match(h.ellipsis)) {
							if (this.expectPlugin("objectRestSpread"), o = this.parseSpread(t ? { start: 0 } : void 0), t && this.toAssignable(o, !0, "object pattern"), a.properties.push(o), !t) continue;var d = this.state.start;if (null !== n) this.unexpected(n, "Cannot have multiple rest elements when destructuring");else {
								if (this.eat(h.braceR)) break;if (!this.match(h.comma) || this.lookahead().type !== h.braceR) {
									n = d;continue;
								}this.unexpected(d, "A trailing comma is not permitted after the rest element");
							}
						}if (o.method = !1, (t || e) && (l = this.state.start, u = this.state.startLoc), t || (p = this.eat(h.star)), !t && this.isContextual("async")) {
							p && this.unexpected();var f = this.parseIdentifier();this.match(h.colon) || this.match(h.parenL) || this.match(h.braceR) || this.match(h.eq) || this.match(h.comma) ? (o.key = f, o.computed = !1) : (c = !0, this.match(h.star) && (this.expectPlugin("asyncGenerators"), this.next(), p = !0), this.parsePropertyName(o));
						} else this.parsePropertyName(o);this.parseObjPropValue(o, l, u, p, c, t, e), this.checkPropClash(o, i), o.shorthand && this.addExtra(o, "shorthand", !0), a.properties.push(o);
					}return null !== n && this.unexpected(n, "The rest element has to be the last element when destructuring"), s.length && this.raise(this.state.start, "You have trailing decorators with no property"), this.finishNode(a, t ? "ObjectPattern" : "ObjectExpression");
				}, i.isGetterOrSetterMethod = function (t, e) {
					return !e && !t.computed && "Identifier" === t.key.type && ("get" === t.key.name || "set" === t.key.name) && (this.match(h.string) || this.match(h.num) || this.match(h.bracketL) || this.match(h.name) || !!this.state.type.keyword);
				}, i.checkGetterSetterParamCount = function (t) {
					var e = "get" === t.kind ? 0 : 1;if (t.params.length !== e) {
						var s = t.start;"get" === t.kind ? this.raise(s, "getter should have no params") : this.raise(s, "setter should have exactly one param");
					}
				}, i.parseObjectMethod = function (t, e, s, i) {
					return s || e || this.match(h.parenL) ? (i && this.unexpected(), t.kind = "method", t.method = !0, this.parseMethod(t, e, s, !1, "ObjectMethod")) : this.isGetterOrSetterMethod(t, i) ? ((e || s) && this.unexpected(), t.kind = t.key.name, this.parsePropertyName(t), this.parseMethod(t, !1, !1, !1, "ObjectMethod"), this.checkGetterSetterParamCount(t), t) : void 0;
				}, i.parseObjectProperty = function (t, e, s, i, r) {
					return t.shorthand = !1, this.eat(h.colon) ? (t.value = i ? this.parseMaybeDefault(this.state.start, this.state.startLoc) : this.parseMaybeAssign(!1, r), this.finishNode(t, "ObjectProperty")) : t.computed || "Identifier" !== t.key.type ? void 0 : (this.checkReservedWord(t.key.name, t.key.start, !0, !0), i ? t.value = this.parseMaybeDefault(e, s, t.key.__clone()) : this.match(h.eq) && r ? (r.start || (r.start = this.state.start), t.value = this.parseMaybeDefault(e, s, t.key.__clone())) : t.value = t.key.__clone(), t.shorthand = !0, this.finishNode(t, "ObjectProperty"));
				}, i.parseObjPropValue = function (t, e, s, i, r, a, n) {
					var o = this.parseObjectMethod(t, i, r, a) || this.parseObjectProperty(t, e, s, a, n);return o || this.unexpected(), o;
				}, i.parsePropertyName = function (t) {
					if (this.eat(h.bracketL)) t.computed = !0, t.key = this.parseMaybeAssign(), this.expect(h.bracketR);else {
						var e = this.state.inPropertyName;this.state.inPropertyName = !0, t.key = this.match(h.num) || this.match(h.string) ? this.parseExprAtom() : this.parseMaybePrivateName(), "PrivateName" !== t.key.type && (t.computed = !1), this.state.inPropertyName = e;
					}return t.key;
				}, i.initFunction = function (t, e) {
					t.id = null, t.generator = !1, t.async = !!e;
				}, i.parseMethod = function (t, e, s, i, r) {
					var a = this.state.inFunction,
					    n = this.state.inMethod,
					    o = this.state.inGenerator;this.state.inFunction = !0, this.state.inMethod = t.kind || !0, this.state.inGenerator = e, this.initFunction(t, s), t.generator = !!e;var h = i;return this.parseFunctionParams(t, h), this.parseFunctionBodyAndFinish(t, r), this.state.inFunction = a, this.state.inMethod = n, this.state.inGenerator = o, t;
				}, i.parseArrowExpression = function (t, e, s) {
					this.state.yieldInPossibleArrowParameters && this.raise(this.state.yieldInPossibleArrowParameters.start, "yield is not allowed in the parameters of an arrow function inside a generator");var i = this.state.inFunction;this.state.inFunction = !0, this.initFunction(t, s), e && this.setArrowFunctionParameters(t, e);var r = this.state.inGenerator,
					    a = this.state.maybeInArrowParameters;return this.state.inGenerator = !1, this.state.maybeInArrowParameters = !1, this.parseFunctionBody(t, !0), this.state.inGenerator = r, this.state.inFunction = i, this.state.maybeInArrowParameters = a, this.finishNode(t, "ArrowFunctionExpression");
				}, i.setArrowFunctionParameters = function (t, e) {
					t.params = this.toAssignableList(e, !0, "arrow function parameters");
				}, i.isStrictBody = function (t) {
					if ("BlockStatement" === t.body.type && t.body.directives.length) for (var e = 0, s = t.body.directives; e < s.length; e++) {
						if ("use strict" === s[e].value.value) return !0;
					}return !1;
				}, i.parseFunctionBodyAndFinish = function (t, e, s) {
					this.parseFunctionBody(t, s), this.finishNode(t, e);
				}, i.parseFunctionBody = function (t, e) {
					var s = e && !this.match(h.braceL),
					    i = this.state.inParameters,
					    r = this.state.inAsync;if (this.state.inParameters = !1, this.state.inAsync = t.async, s) t.body = this.parseMaybeAssign();else {
						var a = this.state.inGenerator,
						    n = this.state.inFunction,
						    o = this.state.labels;this.state.inGenerator = t.generator, this.state.inFunction = !0, this.state.labels = [], t.body = this.parseBlock(!0), this.state.inFunction = n, this.state.inGenerator = a, this.state.labels = o;
					}this.state.inAsync = r, this.checkFunctionNameAndParams(t, e), this.state.inParameters = i;
				}, i.checkFunctionNameAndParams = function (t, e) {
					var s = this.isStrictBody(t),
					    i = this.state.strict || s || e,
					    r = this.state.strict;if (s && (this.state.strict = s), t.id && this.checkReservedWord(t.id, t.start, !0, !0), i) {
						var a = Object.create(null);t.id && this.checkLVal(t.id, !0, void 0, "function name");for (var n = 0, o = t.params; n < o.length; n++) {
							var h = o[n];s && "Identifier" !== h.type && this.raise(h.start, "Non-simple parameter in strict mode"), this.checkLVal(h, !0, a, "function parameter list");
						}
					}this.state.strict = r;
				}, i.parseExprList = function (t, e, s) {
					for (var i = [], r = !0; !this.eat(t);) {
						if (r) r = !1;else if (this.expect(h.comma), this.eat(t)) break;i.push(this.parseExprListItem(e, s));
					}return i;
				}, i.parseExprListItem = function (t, e, s, i) {
					var r;return t && this.match(h.comma) ? r = null : this.match(h.ellipsis) ? (r = this.parseSpread(e), i && this.match(h.comma) && (i.start = this.state.start)) : r = this.parseMaybeAssign(!1, e, this.parseParenItem, s), r;
				}, i.parseIdentifier = function (t) {
					var e = this.startNode(),
					    s = this.parseIdentifierName(e.start, t);return e.name = s, e.loc.identifierName = s, this.finishNode(e, "Identifier");
				}, i.parseIdentifierName = function (t, e) {
					var s;if (e || this.checkReservedWord(this.state.value, this.state.start, !!this.state.type.keyword, !1), this.match(h.name)) s = this.state.value;else {
						if (!this.state.type.keyword) throw this.unexpected();s = this.state.type.keyword;
					}return !e && "await" === s && this.state.inAsync && this.raise(t, "invalid use of await inside of an async function"), this.next(), s;
				}, i.checkReservedWord = function (t, e, s, i) {
					this.state.strict && (l.strict(t) || i && l.strictBind(t)) && this.raise(e, t + " is a reserved word in strict mode"), this.state.inGenerator && "yield" === t && this.raise(e, "yield is a reserved word inside generator functions"), (this.isReservedWord(t) || s && this.isKeyword(t)) && this.raise(e, t + " is a reserved word");
				}, i.parseAwait = function (t) {
					return this.state.inAsync || this.unexpected(), this.match(h.star) && this.raise(t.start, "await* has been removed from the async functions proposal. Use Promise.all() instead."), t.argument = this.parseMaybeUnary(), this.finishNode(t, "AwaitExpression");
				}, i.parseYield = function () {
					var t = this.startNode();return this.state.inParameters && this.raise(t.start, "yield is not allowed in generator parameters"), this.state.maybeInArrowParameters && !this.state.yieldInPossibleArrowParameters && (this.state.yieldInPossibleArrowParameters = t), this.next(), this.match(h.semi) || this.canInsertSemicolon() || !this.match(h.star) && !this.state.type.startsExpr ? (t.delegate = !1, t.argument = null) : (t.delegate = this.eat(h.star), t.argument = this.parseMaybeAssign()), this.finishNode(t, "YieldExpression");
				}, e;
			}(function (t) {
				function e() {
					return t.apply(this, arguments) || this;
				}s(e, t);var i = e.prototype;return i.toAssignable = function (t, e, s) {
					if (t) switch (t.type) {case "Identifier":case "ObjectPattern":case "ArrayPattern":case "AssignmentPattern":
							break;case "ObjectExpression":
							t.type = "ObjectPattern";for (var i = 0; i < t.properties.length; i++) {
								var r = t.properties[i],
								    a = i === t.properties.length - 1;this.toAssignableObjectExpressionProp(r, e, a);
							}break;case "ObjectProperty":
							this.toAssignable(t.value, e, s);break;case "SpreadElement":
							this.checkToRestConversion(t), t.type = "RestElement";var n = t.argument;this.toAssignable(n, e, s);break;case "ArrayExpression":
							t.type = "ArrayPattern", this.toAssignableList(t.elements, e, s);break;case "AssignmentExpression":
							"=" === t.operator ? (t.type = "AssignmentPattern", delete t.operator) : this.raise(t.left.end, "Only '=' operator can be used for specifying default value.");break;case "MemberExpression":
							if (!e) break;default:
							var o = "Invalid left-hand side" + (s ? " in " + s : "expression");this.raise(t.start, o);}return t;
				}, i.toAssignableObjectExpressionProp = function (t, e, s) {
					if ("ObjectMethod" === t.type) {
						var i = "get" === t.kind || "set" === t.kind ? "Object pattern can't contain getter or setter" : "Object pattern can't contain methods";this.raise(t.key.start, i);
					} else "SpreadElement" !== t.type || s ? this.toAssignable(t, e, "object destructuring pattern") : this.raise(t.start, "The rest element has to be the last element when destructuring");
				}, i.toAssignableList = function (t, e, s) {
					var i = t.length;if (i) {
						var r = t[i - 1];if (r && "RestElement" === r.type) --i;else if (r && "SpreadElement" === r.type) {
							r.type = "RestElement";var a = r.argument;this.toAssignable(a, e, s), "Identifier" !== a.type && "MemberExpression" !== a.type && "ArrayPattern" !== a.type && this.unexpected(a.start), --i;
						}
					}for (var n = 0; n < i; n++) {
						var o = t[n];o && "SpreadElement" === o.type && this.raise(o.start, "The rest element has to be the last element when destructuring"), o && this.toAssignable(o, e, s);
					}return t;
				}, i.toReferencedList = function (t) {
					return t;
				}, i.parseSpread = function (t) {
					var e = this.startNode();return this.next(), e.argument = this.parseMaybeAssign(!1, t), this.finishNode(e, "SpreadElement");
				}, i.parseRest = function () {
					var t = this.startNode();return this.next(), t.argument = this.parseBindingAtom(), this.finishNode(t, "RestElement");
				}, i.shouldAllowYieldIdentifier = function () {
					return this.match(h._yield) && !this.state.strict && !this.state.inGenerator;
				}, i.parseBindingIdentifier = function () {
					return this.parseIdentifier(this.shouldAllowYieldIdentifier());
				}, i.parseBindingAtom = function () {
					switch (this.state.type) {case h._yield:case h.name:
							return this.parseBindingIdentifier();case h.bracketL:
							var t = this.startNode();return this.next(), t.elements = this.parseBindingList(h.bracketR, !0), this.finishNode(t, "ArrayPattern");case h.braceL:
							return this.parseObj(!0);default:
							throw this.unexpected();}
				}, i.parseBindingList = function (t, e, s) {
					for (var i = [], r = !0; !this.eat(t);) {
						if (r ? r = !1 : this.expect(h.comma), e && this.match(h.comma)) i.push(null);else {
							if (this.eat(t)) break;if (this.match(h.ellipsis)) {
								i.push(this.parseAssignableListItemTypes(this.parseRest())), this.expect(t);break;
							}var a = [];for (this.match(h.at) && this.hasPlugin("decorators2") && this.raise(this.state.start, "Stage 2 decorators cannot be used to decorate parameters"); this.match(h.at);) {
								a.push(this.parseDecorator());
							}i.push(this.parseAssignableListItem(s, a));
						}
					}return i;
				}, i.parseAssignableListItem = function (t, e) {
					var s = this.parseMaybeDefault();this.parseAssignableListItemTypes(s);var i = this.parseMaybeDefault(s.start, s.loc.start, s);return e.length && (s.decorators = e), i;
				}, i.parseAssignableListItemTypes = function (t) {
					return t;
				}, i.parseMaybeDefault = function (t, e, s) {
					if (e = e || this.state.startLoc, t = t || this.state.start, s = s || this.parseBindingAtom(), !this.eat(h.eq)) return s;var i = this.startNodeAt(t, e);return i.left = s, i.right = this.parseMaybeAssign(), this.finishNode(i, "AssignmentPattern");
				}, i.checkLVal = function (t, e, s, i) {
					switch (t.type) {case "Identifier":
							if (this.checkReservedWord(t.name, t.start, !1, !0), s) {
								var r = '_' + t.name;s[r] ? this.raise(t.start, "Argument name clash in strict mode") : s[r] = !0;
							}break;case "MemberExpression":
							e && this.raise(t.start, "Binding member expression");break;case "ObjectPattern":
							for (var a = 0, n = t.properties; a < n.length; a++) {
								var o = n[a];"ObjectProperty" === o.type && (o = o.value), this.checkLVal(o, e, s, "object destructuring pattern");
							}break;case "ArrayPattern":
							for (var h = 0, p = t.elements; h < p.length; h++) {
								var c = p[h];c && this.checkLVal(c, e, s, "array destructuring pattern");
							}break;case "AssignmentPattern":
							this.checkLVal(t.left, e, s, "assignment pattern");break;case "RestElement":
							this.checkLVal(t.argument, e, s, "rest element");break;default:
							var l = (e ? "Binding invalid" : "Invalid") + " left-hand side" + (i ? " in " + i : "expression");this.raise(t.start, l);}
				}, i.checkToRestConversion = function (t) {
					-1 === ["Identifier", "MemberExpression"].indexOf(t.argument.type) && this.raise(t.argument.start, "Invalid rest operator's argument");
				}, e;
			}(function (t) {
				function e() {
					return t.apply(this, arguments) || this;
				}s(e, t);var i = e.prototype;return i.startNode = function () {
					return new B(this, this.state.start, this.state.startLoc);
				}, i.startNodeAt = function (t, e) {
					return new B(this, t, e);
				}, i.startNodeAtNode = function (t) {
					return this.startNodeAt(t.start, t.loc.start);
				}, i.finishNode = function (t, e) {
					return this.finishNodeAt(t, e, this.state.lastTokEnd, this.state.lastTokEndLoc);
				}, i.finishNodeAt = function (t, e, s, i) {
					return t.type = e, t.end = s, t.loc.end = i, this.options.ranges && (t.range[1] = s), this.processComment(t), t;
				}, i.resetStartLocationFromNode = function (t, e) {
					t.start = e.start, t.loc.start = e.loc.start, this.options.ranges && (t.range[0] = e.range[0]);
				}, e;
			}(j)))));function G(t) {
				return null != t && "Property" === t.type && "init" === t.kind && !1 === t.method;
			}var X = ["any", "bool", "boolean", "empty", "false", "mixed", "null", "number", "static", "string", "true", "typeof", "void"];function J(t) {
				return "type" === t.importKind || "typeof" === t.importKind;
			}function H(t) {
				return (t.type === h.name || !!t.type.keyword) && "from" !== t.value;
			}var $ = { const: "declare export var", let: "declare export var", type: "export type", interface: "export interface" };var z = { quot: '"', amp: "&", apos: "'", lt: "<", gt: ">", nbsp: "??", iexcl: "??", cent: "??", pound: "??", curren: "??", yen: "??", brvbar: "??", sect: "??", uml: "??", copy: "??", ordf: "??", laquo: "??", not: "??", shy: "??", reg: "??", macr: "??", deg: "??", plusmn: "??", sup2: "??", sup3: "??", acute: "??", micro: "??", para: "??", middot: "??", cedil: "??", sup1: "??", ordm: "??", raquo: "??", frac14: "??", frac12: "??", frac34: "??", iquest: "??", Agrave: "??", Aacute: "??", Acirc: "??", Atilde: "??", Auml: "??", Aring: "??", AElig: "??", Ccedil: "??", Egrave: "??", Eacute: "??", Ecirc: "??", Euml: "??", Igrave: "??", Iacute: "??", Icirc: "??", Iuml: "??", ETH: "??", Ntilde: "??", Ograve: "??", Oacute: "??", Ocirc: "??", Otilde: "??", Ouml: "??", times: "??", Oslash: "??", Ugrave: "??", Uacute: "??", Ucirc: "??", Uuml: "??", Yacute: "??", THORN: "??", szlig: "??", agrave: "??", aacute: "??", acirc: "??", atilde: "??", auml: "??", aring: "??", aelig: "??", ccedil: "??", egrave: "??", eacute: "??", ecirc: "??", euml: "??", igrave: "??", iacute: "??", icirc: "??", iuml: "??", eth: "??", ntilde: "??", ograve: "??", oacute: "??", ocirc: "??", otilde: "??", ouml: "??", divide: "??", oslash: "??", ugrave: "??", uacute: "??", ucirc: "??", uuml: "??", yacute: "??", thorn: "??", yuml: "??", OElig: "??", oelig: "??", Scaron: "??", scaron: "??", Yuml: "??", fnof: "??", circ: "??", tilde: "??", Alpha: "??", Beta: "??", Gamma: "??", Delta: "??", Epsilon: "??", Zeta: "??", Eta: "??", Theta: "??", Iota: "??", Kappa: "??", Lambda: "??", Mu: "??", Nu: "??", Xi: "??", Omicron: "??", Pi: "??", Rho: "??", Sigma: "??", Tau: "??", Upsilon: "??", Phi: "??", Chi: "??", Psi: "??", Omega: "??", alpha: "??", beta: "??", gamma: "??", delta: "??", epsilon: "??", zeta: "??", eta: "??", theta: "??", iota: "??", kappa: "??", lambda: "??", mu: "??", nu: "??", xi: "??", omicron: "??", pi: "??", rho: "??", sigmaf: "??", sigma: "??", tau: "??", upsilon: "??", phi: "??", chi: "??", psi: "??", omega: "??", thetasym: "??", upsih: "??", piv: "??", ensp: "???", emsp: "???", thinsp: "???", zwnj: "???", zwj: "???", lrm: "???", rlm: "???", ndash: "???", mdash: "???", lsquo: "???", rsquo: "???", sbquo: "???", ldquo: "???", rdquo: "???", bdquo: "???", dagger: "???", Dagger: "???", bull: "???", hellip: "???", permil: "???", prime: "???", Prime: "???", lsaquo: "???", rsaquo: "???", oline: "???", frasl: "???", euro: "???", image: "???", weierp: "???", real: "???", trade: "???", alefsym: "???", larr: "???", uarr: "???", rarr: "???", darr: "???", harr: "???", crarr: "???", lArr: "???", uArr: "???", rArr: "???", dArr: "???", hArr: "???", forall: "???", part: "???", exist: "???", empty: "???", nabla: "???", isin: "???", notin: "???", ni: "???", prod: "???", sum: "???", minus: "???", lowast: "???", radic: "???", prop: "???", infin: "???", ang: "???", and: "???", or: "???", cap: "???", cup: "???", int: "???", there4: "???", sim: "???", cong: "???", asymp: "???", ne: "???", equiv: "???", le: "???", ge: "???", sub: "???", sup: "???", nsub: "???", sube: "???", supe: "???", oplus: "???", otimes: "???", perp: "???", sdot: "???", lceil: "???", rceil: "???", lfloor: "???", rfloor: "???", lang: "???", rang: "???", loz: "???", spades: "???", clubs: "???", hearts: "???", diams: "???" },
			    Q = /^[\da-fA-F]+$/,
			    Y = /^\d+$/;function Z(t) {
				return !!t && ("JSXOpeningFragment" === t.type || "JSXClosingFragment" === t.type);
			}function tt(t) {
				if ("JSXIdentifier" === t.type) return t.name;if ("JSXNamespacedName" === t.type) return t.namespace.name + ":" + t.name.name;if ("JSXMemberExpression" === t.type) return tt(t.object) + "." + tt(t.property);throw new Error("Node had unexpected type: " + t.type);
			}E.j_oTag = new C("<tag", !1), E.j_cTag = new C("</tag", !1), E.j_expr = new C("<tag>...</tag>", !0, !0), h.jsxName = new a("jsxName"), h.jsxText = new a("jsxText", { beforeExpr: !0 }), h.jsxTagStart = new a("jsxTagStart", { startsExpr: !0 }), h.jsxTagEnd = new a("jsxTagEnd"), h.jsxTagStart.updateContext = function () {
				this.state.context.push(E.j_expr), this.state.context.push(E.j_oTag), this.state.exprAllowed = !1;
			}, h.jsxTagEnd.updateContext = function (t) {
				var e = this.state.context.pop();e === E.j_oTag && t === h.slash || e === E.j_cTag ? (this.state.context.pop(), this.state.exprAllowed = this.curContext() === E.j_expr) : this.state.exprAllowed = !0;
			};function et(t) {
				if (null == t) throw new Error('Unexpected ' + t + ' value.');return t;
			}function st(t) {
				if (!t) throw new Error("Assert fail");
			}function it(t, e) {
				return new (t && t.plugins ? function (t) {
					if (t.indexOf("decorators") >= 0 && t.indexOf("decorators2") >= 0) throw new Error("Cannot use decorators and decorators2 plugin together");var e = t.filter(function (t) {
						return "estree" === t || "flow" === t || "jsx" === t || "typescript" === t;
					});e.indexOf("flow") >= 0 && (e = e.filter(function (t) {
						return "flow" !== t;
					})).push("flow");if (e.indexOf("flow") >= 0 && e.indexOf("typescript") >= 0) throw new Error("Cannot combine flow and typescript plugins.");e.indexOf("typescript") >= 0 && (e = e.filter(function (t) {
						return "typescript" !== t;
					})).push("typescript");e.indexOf("estree") >= 0 && (e = e.filter(function (t) {
						return "estree" !== t;
					})).unshift("estree");var s = e.join("/"),
					    i = rt[s];if (!i) {
						i = W;for (var r = 0, a = e; r < a.length; r++) {
							var n = a[r];i = K[n](i);
						}rt[s] = i;
					}return i;
				}(t.plugins) : W)(t, e);
			}K.estree = function (t) {
				return function (t) {
					function e() {
						return t.apply(this, arguments) || this;
					}s(e, t);var i = e.prototype;return i.estreeParseRegExpLiteral = function (t) {
						var e = t.pattern,
						    s = t.flags,
						    i = null;try {
							i = new RegExp(e, s);
						} catch (t) {}var r = this.estreeParseLiteral(i);return r.regex = { pattern: e, flags: s }, r;
					}, i.estreeParseLiteral = function (t) {
						return this.parseLiteral(t, "Literal");
					}, i.directiveToStmt = function (t) {
						var e = t.value,
						    s = this.startNodeAt(t.start, t.loc.start),
						    i = this.startNodeAt(e.start, e.loc.start);return i.value = e.value, i.raw = e.extra.raw, s.expression = this.finishNodeAt(i, "Literal", e.end, e.loc.end), s.directive = e.extra.raw.slice(1, -1), this.finishNodeAt(s, "ExpressionStatement", t.end, t.loc.end);
					}, i.initFunction = function (e, s) {
						t.prototype.initFunction.call(this, e, s), e.expression = !1;
					}, i.checkDeclaration = function (e) {
						G(e) ? this.checkDeclaration(e.value) : t.prototype.checkDeclaration.call(this, e);
					}, i.checkGetterSetterParamCount = function (t) {
						var e = "get" === t.kind ? 0 : 1;if (t.value.params.length !== e) {
							var s = t.start;"get" === t.kind ? this.raise(s, "getter should have no params") : this.raise(s, "setter should have exactly one param");
						}
					}, i.checkLVal = function (e, s, i, r) {
						var a = this;switch (e.type) {case "ObjectPattern":
								e.properties.forEach(function (t) {
									a.checkLVal("Property" === t.type ? t.value : t, s, i, "object destructuring pattern");
								});break;default:
								t.prototype.checkLVal.call(this, e, s, i, r);}
					}, i.checkPropClash = function (t, e) {
						if (!t.computed && G(t)) {
							var s = t.key;"__proto__" === ("Identifier" === s.type ? s.name : String(s.value)) && (e.proto && this.raise(s.start, "Redefinition of __proto__ property"), e.proto = !0);
						}
					}, i.isStrictBody = function (t) {
						if ("BlockStatement" === t.body.type && t.body.body.length > 0) for (var e = 0, s = t.body.body; e < s.length; e++) {
							var i = s[e];if ("ExpressionStatement" !== i.type || "Literal" !== i.expression.type) break;if ("use strict" === i.expression.value) return !0;
						}return !1;
					}, i.isValidDirective = function (t) {
						return !("ExpressionStatement" !== t.type || "Literal" !== t.expression.type || "string" != typeof t.expression.value || t.expression.extra && t.expression.extra.parenthesized);
					}, i.stmtToDirective = function (e) {
						var s = t.prototype.stmtToDirective.call(this, e),
						    i = e.expression.value;return s.value.value = i, s;
					}, i.parseBlockBody = function (e, s, i, r) {
						var a = this;t.prototype.parseBlockBody.call(this, e, s, i, r);var n = e.directives.map(function (t) {
							return a.directiveToStmt(t);
						});e.body = n.concat(e.body), delete e.directives;
					}, i.pushClassMethod = function (t, e, s, i, r) {
						this.parseMethod(e, s, i, r, "MethodDefinition"), e.typeParameters && (e.value.typeParameters = e.typeParameters, delete e.typeParameters), t.body.push(e);
					}, i.parseExprAtom = function (e) {
						switch (this.state.type) {case h.regexp:
								return this.estreeParseRegExpLiteral(this.state.value);case h.num:case h.string:
								return this.estreeParseLiteral(this.state.value);case h._null:
								return this.estreeParseLiteral(null);case h._true:
								return this.estreeParseLiteral(!0);case h._false:
								return this.estreeParseLiteral(!1);default:
								return t.prototype.parseExprAtom.call(this, e);}
					}, i.parseLiteral = function (e, s, i, r) {
						var a = t.prototype.parseLiteral.call(this, e, s, i, r);return a.raw = a.extra.raw, delete a.extra, a;
					}, i.parseFunctionBody = function (e, s) {
						t.prototype.parseFunctionBody.call(this, e, s), e.expression = "BlockStatement" !== e.body.type;
					}, i.parseMethod = function (e, s, i, r, a) {
						var n = this.startNode();return n.kind = e.kind, delete (n = t.prototype.parseMethod.call(this, n, s, i, r, "FunctionExpression")).kind, e.value = n, this.finishNode(e, a);
					}, i.parseObjectMethod = function (e, s, i, r) {
						var a = t.prototype.parseObjectMethod.call(this, e, s, i, r);return a && (a.type = "Property", "method" === a.kind && (a.kind = "init"), a.shorthand = !1), a;
					}, i.parseObjectProperty = function (e, s, i, r, a) {
						var n = t.prototype.parseObjectProperty.call(this, e, s, i, r, a);return n && (n.kind = "init", n.type = "Property"), n;
					}, i.toAssignable = function (e, s, i) {
						return G(e) ? (this.toAssignable(e.value, s, i), e) : t.prototype.toAssignable.call(this, e, s, i);
					}, i.toAssignableObjectExpressionProp = function (e, s, i) {
						"get" === e.kind || "set" === e.kind ? this.raise(e.key.start, "Object pattern can't contain getter or setter") : e.method ? this.raise(e.key.start, "Object pattern can't contain methods") : t.prototype.toAssignableObjectExpressionProp.call(this, e, s, i);
					}, e;
				}(t);
			}, K.flow = function (t) {
				return function (t) {
					function e() {
						return t.apply(this, arguments) || this;
					}s(e, t);var i = e.prototype;return i.flowParseTypeInitialiser = function (t) {
						var e = this.state.inType;this.state.inType = !0, this.expect(t || h.colon);var s = this.flowParseType();return this.state.inType = e, s;
					}, i.flowParsePredicate = function () {
						var t = this.startNode(),
						    e = this.state.startLoc,
						    s = this.state.start;this.expect(h.modulo);var i = this.state.startLoc;return this.expectContextual("checks"), e.line === i.line && e.column === i.column - 1 || this.raise(s, "Spaces between ??%?? and ??checks?? are not allowed here."), this.eat(h.parenL) ? (t.value = this.parseExpression(), this.expect(h.parenR), this.finishNode(t, "DeclaredPredicate")) : this.finishNode(t, "InferredPredicate");
					}, i.flowParseTypeAndPredicateInitialiser = function () {
						var t = this.state.inType;this.state.inType = !0, this.expect(h.colon);var e = null,
						    s = null;return this.match(h.modulo) ? (this.state.inType = t, s = this.flowParsePredicate()) : (e = this.flowParseType(), this.state.inType = t, this.match(h.modulo) && (s = this.flowParsePredicate())), [e, s];
					}, i.flowParseDeclareClass = function (t) {
						return this.next(), this.flowParseInterfaceish(t, !0), this.finishNode(t, "DeclareClass");
					}, i.flowParseDeclareFunction = function (t) {
						this.next();var e = t.id = this.parseIdentifier(),
						    s = this.startNode(),
						    i = this.startNode();this.isRelational("<") ? s.typeParameters = this.flowParseTypeParameterDeclaration() : s.typeParameters = null, this.expect(h.parenL);var r = this.flowParseFunctionTypeParams();s.params = r.params, s.rest = r.rest, this.expect(h.parenR);var a = this.flowParseTypeAndPredicateInitialiser();return s.returnType = a[0], t.predicate = a[1], i.typeAnnotation = this.finishNode(s, "FunctionTypeAnnotation"), e.typeAnnotation = this.finishNode(i, "TypeAnnotation"), this.finishNode(e, e.type), this.semicolon(), this.finishNode(t, "DeclareFunction");
					}, i.flowParseDeclare = function (t, e) {
						if (this.match(h._class)) return this.flowParseDeclareClass(t);if (this.match(h._function)) return this.flowParseDeclareFunction(t);if (this.match(h._var)) return this.flowParseDeclareVariable(t);if (this.isContextual("module")) return this.lookahead().type === h.dot ? this.flowParseDeclareModuleExports(t) : (e && this.unexpected(null, "`declare module` cannot be used inside another `declare module`"), this.flowParseDeclareModule(t));if (this.isContextual("type")) return this.flowParseDeclareTypeAlias(t);if (this.isContextual("opaque")) return this.flowParseDeclareOpaqueType(t);if (this.isContextual("interface")) return this.flowParseDeclareInterface(t);if (this.match(h._export)) return this.flowParseDeclareExportDeclaration(t, e);throw this.unexpected();
					}, i.flowParseDeclareVariable = function (t) {
						return this.next(), t.id = this.flowParseTypeAnnotatableIdentifier(!0), this.semicolon(), this.finishNode(t, "DeclareVariable");
					}, i.flowParseDeclareModule = function (t) {
						var e = this;this.next(), this.match(h.string) ? t.id = this.parseExprAtom() : t.id = this.parseIdentifier();var s = t.body = this.startNode(),
						    i = s.body = [];for (this.expect(h.braceL); !this.match(h.braceR);) {
							var r = this.startNode();if (this.match(h._import)) {
								var a = this.lookahead();"type" !== a.value && "typeof" !== a.value && this.unexpected(null, "Imports within a `declare module` body must always be `import type` or `import typeof`"), this.next(), this.parseImport(r);
							} else this.expectContextual("declare", "Only declares and type imports are allowed inside declare module"), r = this.flowParseDeclare(r, !0);i.push(r);
						}this.expect(h.braceR), this.finishNode(s, "BlockStatement");var n = null,
						    o = !1,
						    p = "Found both `declare module.exports` and `declare export` in the same module. Modules can only have 1 since they are either an ES module or they are a CommonJS module";return i.forEach(function (t) {
							!function (t) {
								return "DeclareExportAllDeclaration" === t.type || "DeclareExportDeclaration" === t.type && (!t.declaration || "TypeAlias" !== t.declaration.type && "InterfaceDeclaration" !== t.declaration.type);
							}(t) ? "DeclareModuleExports" === t.type && (o && e.unexpected(t.start, "Duplicate `declare module.exports` statement"), "ES" === n && e.unexpected(t.start, p), n = "CommonJS", o = !0) : ("CommonJS" === n && e.unexpected(t.start, p), n = "ES");
						}), t.kind = n || "CommonJS", this.finishNode(t, "DeclareModule");
					}, i.flowParseDeclareExportDeclaration = function (t, e) {
						if (this.expect(h._export), this.eat(h._default)) return this.match(h._function) || this.match(h._class) ? t.declaration = this.flowParseDeclare(this.startNode()) : (t.declaration = this.flowParseType(), this.semicolon()), t.default = !0, this.finishNode(t, "DeclareExportDeclaration");if (this.match(h._const) || this.match(h._let) || (this.isContextual("type") || this.isContextual("interface")) && !e) {
							var s = this.state.value,
							    i = $[s];this.unexpected(this.state.start, '`declare export ' + s + '` is not supported. Use `' + i + '` instead');
						}if (this.match(h._var) || this.match(h._function) || this.match(h._class) || this.isContextual("opaque")) return t.declaration = this.flowParseDeclare(this.startNode()), t.default = !1, this.finishNode(t, "DeclareExportDeclaration");if (this.match(h.star) || this.match(h.braceL) || this.isContextual("interface") || this.isContextual("type") || this.isContextual("opaque")) return "ExportNamedDeclaration" === (t = this.parseExport(t)).type && (t.type = "ExportDeclaration", t.default = !1, delete t.exportKind), t.type = "Declare" + t.type, t;throw this.unexpected();
					}, i.flowParseDeclareModuleExports = function (t) {
						return this.expectContextual("module"), this.expect(h.dot), this.expectContextual("exports"), t.typeAnnotation = this.flowParseTypeAnnotation(), this.semicolon(), this.finishNode(t, "DeclareModuleExports");
					}, i.flowParseDeclareTypeAlias = function (t) {
						return this.next(), this.flowParseTypeAlias(t), this.finishNode(t, "DeclareTypeAlias");
					}, i.flowParseDeclareOpaqueType = function (t) {
						return this.next(), this.flowParseOpaqueType(t, !0), this.finishNode(t, "DeclareOpaqueType");
					}, i.flowParseDeclareInterface = function (t) {
						return this.next(), this.flowParseInterfaceish(t), this.finishNode(t, "DeclareInterface");
					}, i.flowParseInterfaceish = function (t, e) {
						if (t.id = this.flowParseRestrictedIdentifier(!e), this.isRelational("<") ? t.typeParameters = this.flowParseTypeParameterDeclaration() : t.typeParameters = null, t.extends = [], t.mixins = [], this.eat(h._extends)) do {
							t.extends.push(this.flowParseInterfaceExtends());
						} while (!e && this.eat(h.comma));if (this.isContextual("mixins")) {
							this.next();do {
								t.mixins.push(this.flowParseInterfaceExtends());
							} while (this.eat(h.comma));
						}t.body = this.flowParseObjectType(!0, !1, !1);
					}, i.flowParseInterfaceExtends = function () {
						var t = this.startNode();return t.id = this.flowParseQualifiedTypeIdentifier(), this.isRelational("<") ? t.typeParameters = this.flowParseTypeParameterInstantiation() : t.typeParameters = null, this.finishNode(t, "InterfaceExtends");
					}, i.flowParseInterface = function (t) {
						return this.flowParseInterfaceish(t), this.finishNode(t, "InterfaceDeclaration");
					}, i.checkReservedType = function (t, e) {
						X.indexOf(t) > -1 && this.raise(e, 'Cannot overwrite primitive type ' + t);
					}, i.flowParseRestrictedIdentifier = function (t) {
						return this.checkReservedType(this.state.value, this.state.start), this.parseIdentifier(t);
					}, i.flowParseTypeAlias = function (t) {
						return t.id = this.flowParseRestrictedIdentifier(), this.isRelational("<") ? t.typeParameters = this.flowParseTypeParameterDeclaration() : t.typeParameters = null, t.right = this.flowParseTypeInitialiser(h.eq), this.semicolon(), this.finishNode(t, "TypeAlias");
					}, i.flowParseOpaqueType = function (t, e) {
						return this.expectContextual("type"), t.id = this.flowParseRestrictedIdentifier(!0), this.isRelational("<") ? t.typeParameters = this.flowParseTypeParameterDeclaration() : t.typeParameters = null, t.supertype = null, this.match(h.colon) && (t.supertype = this.flowParseTypeInitialiser(h.colon)), t.impltype = null, e || (t.impltype = this.flowParseTypeInitialiser(h.eq)), this.semicolon(), this.finishNode(t, "OpaqueType");
					}, i.flowParseTypeParameter = function () {
						var t = this.startNode(),
						    e = this.flowParseVariance(),
						    s = this.flowParseTypeAnnotatableIdentifier();return t.name = s.name, t.variance = e, t.bound = s.typeAnnotation, this.match(h.eq) && (this.eat(h.eq), t.default = this.flowParseType()), this.finishNode(t, "TypeParameter");
					}, i.flowParseTypeParameterDeclaration = function () {
						var t = this.state.inType,
						    e = this.startNode();e.params = [], this.state.inType = !0, this.isRelational("<") || this.match(h.jsxTagStart) ? this.next() : this.unexpected();do {
							e.params.push(this.flowParseTypeParameter()), this.isRelational(">") || this.expect(h.comma);
						} while (!this.isRelational(">"));return this.expectRelational(">"), this.state.inType = t, this.finishNode(e, "TypeParameterDeclaration");
					}, i.flowParseTypeParameterInstantiation = function () {
						var t = this.startNode(),
						    e = this.state.inType;for (t.params = [], this.state.inType = !0, this.expectRelational("<"); !this.isRelational(">");) {
							t.params.push(this.flowParseType()), this.isRelational(">") || this.expect(h.comma);
						}return this.expectRelational(">"), this.state.inType = e, this.finishNode(t, "TypeParameterInstantiation");
					}, i.flowParseObjectPropertyKey = function () {
						return this.match(h.num) || this.match(h.string) ? this.parseExprAtom() : this.parseIdentifier(!0);
					}, i.flowParseObjectTypeIndexer = function (t, e, s) {
						return t.static = e, this.expect(h.bracketL), this.lookahead().type === h.colon ? (t.id = this.flowParseObjectPropertyKey(), t.key = this.flowParseTypeInitialiser()) : (t.id = null, t.key = this.flowParseType()), this.expect(h.bracketR), t.value = this.flowParseTypeInitialiser(), t.variance = s, this.finishNode(t, "ObjectTypeIndexer");
					}, i.flowParseObjectTypeMethodish = function (t) {
						for (t.params = [], t.rest = null, t.typeParameters = null, this.isRelational("<") && (t.typeParameters = this.flowParseTypeParameterDeclaration()), this.expect(h.parenL); !this.match(h.parenR) && !this.match(h.ellipsis);) {
							t.params.push(this.flowParseFunctionTypeParam()), this.match(h.parenR) || this.expect(h.comma);
						}return this.eat(h.ellipsis) && (t.rest = this.flowParseFunctionTypeParam()), this.expect(h.parenR), t.returnType = this.flowParseTypeInitialiser(), this.finishNode(t, "FunctionTypeAnnotation");
					}, i.flowParseObjectTypeCallProperty = function (t, e) {
						var s = this.startNode();return t.static = e, t.value = this.flowParseObjectTypeMethodish(s), this.finishNode(t, "ObjectTypeCallProperty");
					}, i.flowParseObjectType = function (t, e, s) {
						var i = this.state.inType;this.state.inType = !0;var r,
						    a,
						    n = this.startNode();for (n.callProperties = [], n.properties = [], n.indexers = [], e && this.match(h.braceBarL) ? (this.expect(h.braceBarL), r = h.braceBarR, a = !0) : (this.expect(h.braceL), r = h.braceR, a = !1), n.exact = a; !this.match(r);) {
							var o = !1,
							    p = this.startNode();t && this.isContextual("static") && this.lookahead().type !== h.colon && (this.next(), o = !0);var c = this.flowParseVariance();if (this.match(h.bracketL)) n.indexers.push(this.flowParseObjectTypeIndexer(p, o, c));else if (this.match(h.parenL) || this.isRelational("<")) c && this.unexpected(c.start), n.callProperties.push(this.flowParseObjectTypeCallProperty(p, o));else {
								var l = "init";if (this.isContextual("get") || this.isContextual("set")) {
									var u = this.lookahead();u.type !== h.name && u.type !== h.string && u.type !== h.num || (l = this.state.value, this.next());
								}n.properties.push(this.flowParseObjectTypeProperty(p, o, c, l, s));
							}this.flowObjectTypeSemicolon();
						}this.expect(r);var d = this.finishNode(n, "ObjectTypeAnnotation");return this.state.inType = i, d;
					}, i.flowParseObjectTypeProperty = function (t, e, s, i, r) {
						if (this.match(h.ellipsis)) return r || this.unexpected(null, "Spread operator cannot appear in class or interface definitions"), s && this.unexpected(s.start, "Spread properties cannot have variance"), this.expect(h.ellipsis), t.argument = this.flowParseType(), this.finishNode(t, "ObjectTypeSpreadProperty");t.key = this.flowParseObjectPropertyKey(), t.static = e, t.kind = i;var a = !1;return this.isRelational("<") || this.match(h.parenL) ? (s && this.unexpected(s.start), t.value = this.flowParseObjectTypeMethodish(this.startNodeAt(t.start, t.loc.start)), "get" !== i && "set" !== i || this.flowCheckGetterSetterParamCount(t)) : ("init" !== i && this.unexpected(), this.eat(h.question) && (a = !0), t.value = this.flowParseTypeInitialiser(), t.variance = s), t.optional = a, this.finishNode(t, "ObjectTypeProperty");
					}, i.flowCheckGetterSetterParamCount = function (t) {
						var e = "get" === t.kind ? 0 : 1;if (t.value.params.length !== e) {
							var s = t.start;"get" === t.kind ? this.raise(s, "getter should have no params") : this.raise(s, "setter should have exactly one param");
						}
					}, i.flowObjectTypeSemicolon = function () {
						this.eat(h.semi) || this.eat(h.comma) || this.match(h.braceR) || this.match(h.braceBarR) || this.unexpected();
					}, i.flowParseQualifiedTypeIdentifier = function (t, e, s) {
						t = t || this.state.start, e = e || this.state.startLoc;for (var i = s || this.parseIdentifier(); this.eat(h.dot);) {
							var r = this.startNodeAt(t, e);r.qualification = i, r.id = this.parseIdentifier(), i = this.finishNode(r, "QualifiedTypeIdentifier");
						}return i;
					}, i.flowParseGenericType = function (t, e, s) {
						var i = this.startNodeAt(t, e);return i.typeParameters = null, i.id = this.flowParseQualifiedTypeIdentifier(t, e, s), this.isRelational("<") && (i.typeParameters = this.flowParseTypeParameterInstantiation()), this.finishNode(i, "GenericTypeAnnotation");
					}, i.flowParseTypeofType = function () {
						var t = this.startNode();return this.expect(h._typeof), t.argument = this.flowParsePrimaryType(), this.finishNode(t, "TypeofTypeAnnotation");
					}, i.flowParseTupleType = function () {
						var t = this.startNode();for (t.types = [], this.expect(h.bracketL); this.state.pos < this.input.length && !this.match(h.bracketR) && (t.types.push(this.flowParseType()), !this.match(h.bracketR));) {
							this.expect(h.comma);
						}return this.expect(h.bracketR), this.finishNode(t, "TupleTypeAnnotation");
					}, i.flowParseFunctionTypeParam = function () {
						var t = null,
						    e = !1,
						    s = null,
						    i = this.startNode(),
						    r = this.lookahead();return r.type === h.colon || r.type === h.question ? (t = this.parseIdentifier(), this.eat(h.question) && (e = !0), s = this.flowParseTypeInitialiser()) : s = this.flowParseType(), i.name = t, i.optional = e, i.typeAnnotation = s, this.finishNode(i, "FunctionTypeParam");
					}, i.reinterpretTypeAsFunctionTypeParam = function (t) {
						var e = this.startNodeAt(t.start, t.loc.start);return e.name = null, e.optional = !1, e.typeAnnotation = t, this.finishNode(e, "FunctionTypeParam");
					}, i.flowParseFunctionTypeParams = function (t) {
						void 0 === t && (t = []);for (var e = null; !this.match(h.parenR) && !this.match(h.ellipsis);) {
							t.push(this.flowParseFunctionTypeParam()), this.match(h.parenR) || this.expect(h.comma);
						}return this.eat(h.ellipsis) && (e = this.flowParseFunctionTypeParam()), { params: t, rest: e };
					}, i.flowIdentToTypeAnnotation = function (t, e, s, i) {
						switch (i.name) {case "any":
								return this.finishNode(s, "AnyTypeAnnotation");case "void":
								return this.finishNode(s, "VoidTypeAnnotation");case "bool":case "boolean":
								return this.finishNode(s, "BooleanTypeAnnotation");case "mixed":
								return this.finishNode(s, "MixedTypeAnnotation");case "empty":
								return this.finishNode(s, "EmptyTypeAnnotation");case "number":
								return this.finishNode(s, "NumberTypeAnnotation");case "string":
								return this.finishNode(s, "StringTypeAnnotation");default:
								return this.flowParseGenericType(t, e, i);}
					}, i.flowParsePrimaryType = function () {
						var t,
						    e,
						    s = this.state.start,
						    i = this.state.startLoc,
						    r = this.startNode(),
						    a = !1,
						    n = this.state.noAnonFunctionType;switch (this.state.type) {case h.name:
								return this.flowIdentToTypeAnnotation(s, i, r, this.parseIdentifier());case h.braceL:
								return this.flowParseObjectType(!1, !1, !0);case h.braceBarL:
								return this.flowParseObjectType(!1, !0, !0);case h.bracketL:
								return this.flowParseTupleType();case h.relational:
								if ("<" === this.state.value) return r.typeParameters = this.flowParseTypeParameterDeclaration(), this.expect(h.parenL), t = this.flowParseFunctionTypeParams(), r.params = t.params, r.rest = t.rest, this.expect(h.parenR), this.expect(h.arrow), r.returnType = this.flowParseType(), this.finishNode(r, "FunctionTypeAnnotation");break;case h.parenL:
								if (this.next(), !this.match(h.parenR) && !this.match(h.ellipsis)) if (this.match(h.name)) {
									var o = this.lookahead().type;a = o !== h.question && o !== h.colon;
								} else a = !0;if (a) {
									if (this.state.noAnonFunctionType = !1, e = this.flowParseType(), this.state.noAnonFunctionType = n, this.state.noAnonFunctionType || !(this.match(h.comma) || this.match(h.parenR) && this.lookahead().type === h.arrow)) return this.expect(h.parenR), e;this.eat(h.comma);
								}return t = e ? this.flowParseFunctionTypeParams([this.reinterpretTypeAsFunctionTypeParam(e)]) : this.flowParseFunctionTypeParams(), r.params = t.params, r.rest = t.rest, this.expect(h.parenR), this.expect(h.arrow), r.returnType = this.flowParseType(), r.typeParameters = null, this.finishNode(r, "FunctionTypeAnnotation");case h.string:
								return this.parseLiteral(this.state.value, "StringLiteralTypeAnnotation");case h._true:case h._false:
								return r.value = this.match(h._true), this.next(), this.finishNode(r, "BooleanLiteralTypeAnnotation");case h.plusMin:
								if ("-" === this.state.value) return this.next(), this.match(h.num) || this.unexpected(null, 'Unexpected token, expected "number"'), this.parseLiteral(-this.state.value, "NumberLiteralTypeAnnotation", r.start, r.loc.start);this.unexpected();case h.num:
								return this.parseLiteral(this.state.value, "NumberLiteralTypeAnnotation");case h._null:
								return this.next(), this.finishNode(r, "NullLiteralTypeAnnotation");case h._this:
								return this.next(), this.finishNode(r, "ThisTypeAnnotation");case h.star:
								return this.next(), this.finishNode(r, "ExistsTypeAnnotation");default:
								if ("typeof" === this.state.type.keyword) return this.flowParseTypeofType();}throw this.unexpected();
					}, i.flowParsePostfixType = function () {
						for (var t = this.state.start, e = this.state.startLoc, s = this.flowParsePrimaryType(); !this.canInsertSemicolon() && this.match(h.bracketL);) {
							var i = this.startNodeAt(t, e);i.elementType = s, this.expect(h.bracketL), this.expect(h.bracketR), s = this.finishNode(i, "ArrayTypeAnnotation");
						}return s;
					}, i.flowParsePrefixType = function () {
						var t = this.startNode();return this.eat(h.question) ? (t.typeAnnotation = this.flowParsePrefixType(), this.finishNode(t, "NullableTypeAnnotation")) : this.flowParsePostfixType();
					}, i.flowParseAnonFunctionWithoutParens = function () {
						var t = this.flowParsePrefixType();if (!this.state.noAnonFunctionType && this.eat(h.arrow)) {
							var e = this.startNodeAt(t.start, t.loc.start);return e.params = [this.reinterpretTypeAsFunctionTypeParam(t)], e.rest = null, e.returnType = this.flowParseType(), e.typeParameters = null, this.finishNode(e, "FunctionTypeAnnotation");
						}return t;
					}, i.flowParseIntersectionType = function () {
						var t = this.startNode();this.eat(h.bitwiseAND);var e = this.flowParseAnonFunctionWithoutParens();for (t.types = [e]; this.eat(h.bitwiseAND);) {
							t.types.push(this.flowParseAnonFunctionWithoutParens());
						}return 1 === t.types.length ? e : this.finishNode(t, "IntersectionTypeAnnotation");
					}, i.flowParseUnionType = function () {
						var t = this.startNode();this.eat(h.bitwiseOR);var e = this.flowParseIntersectionType();for (t.types = [e]; this.eat(h.bitwiseOR);) {
							t.types.push(this.flowParseIntersectionType());
						}return 1 === t.types.length ? e : this.finishNode(t, "UnionTypeAnnotation");
					}, i.flowParseType = function () {
						var t = this.state.inType;this.state.inType = !0;var e = this.flowParseUnionType();return this.state.inType = t, this.state.exprAllowed = this.state.exprAllowed || this.state.noAnonFunctionType, e;
					}, i.flowParseTypeAnnotation = function () {
						var t = this.startNode();return t.typeAnnotation = this.flowParseTypeInitialiser(), this.finishNode(t, "TypeAnnotation");
					}, i.flowParseTypeAnnotatableIdentifier = function (t) {
						var e = t ? this.parseIdentifier() : this.flowParseRestrictedIdentifier();return this.match(h.colon) && (e.typeAnnotation = this.flowParseTypeAnnotation(), this.finishNode(e, e.type)), e;
					}, i.typeCastToParameter = function (t) {
						return t.expression.typeAnnotation = t.typeAnnotation, this.finishNodeAt(t.expression, t.expression.type, t.typeAnnotation.end, t.typeAnnotation.loc.end);
					}, i.flowParseVariance = function () {
						var t = null;return this.match(h.plusMin) && (t = this.startNode(), "+" === this.state.value ? t.kind = "plus" : t.kind = "minus", this.next(), this.finishNode(t, "Variance")), t;
					}, i.parseFunctionBody = function (e, s) {
						var i = this;return s ? this.forwardNoArrowParamsConversionAt(e, function () {
							return t.prototype.parseFunctionBody.call(i, e, !0);
						}) : t.prototype.parseFunctionBody.call(this, e, !1);
					}, i.parseFunctionBodyAndFinish = function (e, s, i) {
						if (!i && this.match(h.colon)) {
							var r = this.startNode(),
							    a = this.flowParseTypeAndPredicateInitialiser();r.typeAnnotation = a[0], e.predicate = a[1], e.returnType = r.typeAnnotation ? this.finishNode(r, "TypeAnnotation") : null;
						}t.prototype.parseFunctionBodyAndFinish.call(this, e, s, i);
					}, i.parseStatement = function (e, s) {
						if (this.state.strict && this.match(h.name) && "interface" === this.state.value) {
							var i = this.startNode();return this.next(), this.flowParseInterface(i);
						}return t.prototype.parseStatement.call(this, e, s);
					}, i.parseExpressionStatement = function (e, s) {
						if ("Identifier" === s.type) if ("declare" === s.name) {
							if (this.match(h._class) || this.match(h.name) || this.match(h._function) || this.match(h._var) || this.match(h._export)) return this.flowParseDeclare(e);
						} else if (this.match(h.name)) {
							if ("interface" === s.name) return this.flowParseInterface(e);if ("type" === s.name) return this.flowParseTypeAlias(e);if ("opaque" === s.name) return this.flowParseOpaqueType(e, !1);
						}return t.prototype.parseExpressionStatement.call(this, e, s);
					}, i.shouldParseExportDeclaration = function () {
						return this.isContextual("type") || this.isContextual("interface") || this.isContextual("opaque") || t.prototype.shouldParseExportDeclaration.call(this);
					}, i.isExportDefaultSpecifier = function () {
						return (!this.match(h.name) || "type" !== this.state.value && "interface" !== this.state.value && "opaque" != this.state.value) && t.prototype.isExportDefaultSpecifier.call(this);
					}, i.parseConditional = function (e, s, i, r, a) {
						var n = this;if (!this.match(h.question)) return e;if (a) {
							var o = this.state.clone();try {
								return t.prototype.parseConditional.call(this, e, s, i, r);
							} catch (t) {
								if (t instanceof SyntaxError) return this.state = o, a.start = t.pos || this.state.start, e;throw t;
							}
						}this.expect(h.question);var p = this.state.clone(),
						    c = this.state.noArrowAt,
						    l = this.startNodeAt(i, r),
						    u = this.tryParseConditionalConsequent(),
						    d = u.consequent,
						    f = u.failed,
						    m = this.getArrowLikeExpressions(d),
						    y = m[0],
						    x = m[1];if (f || x.length > 0) {
							var P = c.concat();if (x.length > 0) {
								this.state = p, this.state.noArrowAt = P;for (var v = 0; v < x.length; v++) {
									P.push(x[v].start);
								}var g = this.tryParseConditionalConsequent();d = g.consequent, f = g.failed;var b = this.getArrowLikeExpressions(d);y = b[0], x = b[1];
							}if (f && y.length > 1 && this.raise(p.start, "Ambiguous expression: wrap the arrow functions in parentheses to disambiguate."), f && 1 === y.length) {
								this.state = p, this.state.noArrowAt = P.concat(y[0].start);var T = this.tryParseConditionalConsequent();d = T.consequent, f = T.failed;
							}this.getArrowLikeExpressions(d, !0);
						}return this.state.noArrowAt = c, this.expect(h.colon), l.test = e, l.consequent = d, l.alternate = this.forwardNoArrowParamsConversionAt(l, function () {
							return n.parseMaybeAssign(s, void 0, void 0, void 0);
						}), this.finishNode(l, "ConditionalExpression");
					}, i.tryParseConditionalConsequent = function () {
						this.state.noArrowParamsConversionAt.push(this.state.start);var t = this.parseMaybeAssign(),
						    e = !this.match(h.colon);return this.state.noArrowParamsConversionAt.pop(), { consequent: t, failed: e };
					}, i.getArrowLikeExpressions = function (e, s) {
						for (var i = this, r = [e], a = []; 0 !== r.length;) {
							var n = r.pop();"ArrowFunctionExpression" === n.type ? (n.typeParameters || !n.returnType ? (this.toAssignableList(n.params, !0, "arrow function parameters"), t.prototype.checkFunctionNameAndParams.call(this, n, !0)) : a.push(n), r.push(n.body)) : "ConditionalExpression" === n.type && (r.push(n.consequent), r.push(n.alternate));
						}if (s) {
							for (var o = 0; o < a.length; o++) {
								this.toAssignableList(e.params, !0, "arrow function parameters");
							}return [a, []];
						}return function (t, e) {
							for (var s = [], i = [], r = 0; r < t.length; r++) {
								(e(t[r], r, t) ? s : i).push(t[r]);
							}return [s, i];
						}(a, function (t) {
							try {
								return i.toAssignableList(t.params, !0, "arrow function parameters"), !0;
							} catch (t) {
								return !1;
							}
						});
					}, i.forwardNoArrowParamsConversionAt = function (t, e) {
						var s;return -1 !== this.state.noArrowParamsConversionAt.indexOf(t.start) ? (this.state.noArrowParamsConversionAt.push(this.state.start), s = e(), this.state.noArrowParamsConversionAt.pop()) : s = e(), s;
					}, i.parseParenItem = function (e, s, i) {
						if (e = t.prototype.parseParenItem.call(this, e, s, i), this.eat(h.question) && (e.optional = !0), this.match(h.colon)) {
							var r = this.startNodeAt(s, i);return r.expression = e, r.typeAnnotation = this.flowParseTypeAnnotation(), this.finishNode(r, "TypeCastExpression");
						}return e;
					}, i.assertModuleNodeAllowed = function (e) {
						"ImportDeclaration" === e.type && ("type" === e.importKind || "typeof" === e.importKind) || "ExportNamedDeclaration" === e.type && "type" === e.exportKind || "ExportAllDeclaration" === e.type && "type" === e.exportKind || t.prototype.assertModuleNodeAllowed.call(this, e);
					}, i.parseExport = function (e) {
						return "ExportNamedDeclaration" !== (e = t.prototype.parseExport.call(this, e)).type && "ExportAllDeclaration" !== e.type || (e.exportKind = e.exportKind || "value"), e;
					}, i.parseExportDeclaration = function (e) {
						if (this.isContextual("type")) {
							e.exportKind = "type";var s = this.startNode();return this.next(), this.match(h.braceL) ? (e.specifiers = this.parseExportSpecifiers(), this.parseExportFrom(e), null) : this.flowParseTypeAlias(s);
						}if (this.isContextual("opaque")) {
							e.exportKind = "type";var i = this.startNode();return this.next(), this.flowParseOpaqueType(i, !1);
						}if (this.isContextual("interface")) {
							e.exportKind = "type";var r = this.startNode();return this.next(), this.flowParseInterface(r);
						}return t.prototype.parseExportDeclaration.call(this, e);
					}, i.shouldParseExportStar = function () {
						return t.prototype.shouldParseExportStar.call(this) || this.isContextual("type") && this.lookahead().type === h.star;
					}, i.parseExportStar = function (e) {
						return this.eatContextual("type") && (e.exportKind = "type"), t.prototype.parseExportStar.call(this, e);
					}, i.parseExportNamespace = function (e) {
						return "type" === e.exportKind && this.unexpected(), t.prototype.parseExportNamespace.call(this, e);
					}, i.parseClassId = function (e, s, i) {
						t.prototype.parseClassId.call(this, e, s, i), this.isRelational("<") && (e.typeParameters = this.flowParseTypeParameterDeclaration());
					}, i.isKeyword = function (e) {
						return (!this.state.inType || "void" !== e) && t.prototype.isKeyword.call(this, e);
					}, i.readToken = function (e) {
						return !this.state.inType || 62 !== e && 60 !== e ? t.prototype.readToken.call(this, e) : this.finishOp(h.relational, 1);
					}, i.toAssignable = function (e, s, i) {
						return "TypeCastExpression" === e.type ? t.prototype.toAssignable.call(this, this.typeCastToParameter(e), s, i) : t.prototype.toAssignable.call(this, e, s, i);
					}, i.toAssignableList = function (e, s, i) {
						for (var r = 0; r < e.length; r++) {
							var a = e[r];a && "TypeCastExpression" === a.type && (e[r] = this.typeCastToParameter(a));
						}return t.prototype.toAssignableList.call(this, e, s, i);
					}, i.toReferencedList = function (t) {
						for (var e = 0; e < t.length; e++) {
							var s = t[e];s && s._exprListItem && "TypeCastExpression" === s.type && this.raise(s.start, "Unexpected type cast");
						}return t;
					}, i.parseExprListItem = function (e, s, i) {
						var r = this.startNode(),
						    a = t.prototype.parseExprListItem.call(this, e, s, i);return this.match(h.colon) ? (r._exprListItem = !0, r.expression = a, r.typeAnnotation = this.flowParseTypeAnnotation(), this.finishNode(r, "TypeCastExpression")) : a;
					}, i.checkLVal = function (e, s, i, r) {
						if ("TypeCastExpression" !== e.type) return t.prototype.checkLVal.call(this, e, s, i, r);
					}, i.parseClassProperty = function (e) {
						return this.match(h.colon) && (e.typeAnnotation = this.flowParseTypeAnnotation()), t.prototype.parseClassProperty.call(this, e);
					}, i.isClassMethod = function () {
						return this.isRelational("<") || t.prototype.isClassMethod.call(this);
					}, i.isClassProperty = function () {
						return this.match(h.colon) || t.prototype.isClassProperty.call(this);
					}, i.isNonstaticConstructor = function (e) {
						return !this.match(h.colon) && t.prototype.isNonstaticConstructor.call(this, e);
					}, i.pushClassMethod = function (e, s, i, r, a) {
						s.variance && this.unexpected(s.variance.start), delete s.variance, this.isRelational("<") && (s.typeParameters = this.flowParseTypeParameterDeclaration()), t.prototype.pushClassMethod.call(this, e, s, i, r, a);
					}, i.pushClassPrivateMethod = function (e, s, i, r) {
						s.variance && this.unexpected(s.variance.start), delete s.variance, this.isRelational("<") && (s.typeParameters = this.flowParseTypeParameterDeclaration()), t.prototype.pushClassPrivateMethod.call(this, e, s, i, r);
					}, i.parseClassSuper = function (e) {
						if (t.prototype.parseClassSuper.call(this, e), e.superClass && this.isRelational("<") && (e.superTypeParameters = this.flowParseTypeParameterInstantiation()), this.isContextual("implements")) {
							this.next();var s = e.implements = [];do {
								var i = this.startNode();i.id = this.flowParseRestrictedIdentifier(!0), this.isRelational("<") ? i.typeParameters = this.flowParseTypeParameterInstantiation() : i.typeParameters = null, s.push(this.finishNode(i, "ClassImplements"));
							} while (this.eat(h.comma));
						}
					}, i.parsePropertyName = function (e) {
						var s = this.flowParseVariance(),
						    i = t.prototype.parsePropertyName.call(this, e);return e.variance = s, i;
					}, i.parseObjPropValue = function (e, s, i, r, a, n, o) {
						var p;e.variance && this.unexpected(e.variance.start), delete e.variance, this.isRelational("<") && (p = this.flowParseTypeParameterDeclaration(), this.match(h.parenL) || this.unexpected()), t.prototype.parseObjPropValue.call(this, e, s, i, r, a, n, o), p && ((e.value || e).typeParameters = p);
					}, i.parseAssignableListItemTypes = function (t) {
						if (this.eat(h.question)) {
							if ("Identifier" !== t.type) throw this.raise(t.start, "A binding pattern parameter cannot be optional in an implementation signature.");t.optional = !0;
						}return this.match(h.colon) && (t.typeAnnotation = this.flowParseTypeAnnotation()), this.finishNode(t, t.type), t;
					}, i.parseMaybeDefault = function (e, s, i) {
						var r = t.prototype.parseMaybeDefault.call(this, e, s, i);return "AssignmentPattern" === r.type && r.typeAnnotation && r.right.start < r.typeAnnotation.start && this.raise(r.typeAnnotation.start, "Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`"), r;
					}, i.shouldParseDefaultImport = function (e) {
						return J(e) ? H(this.state) : t.prototype.shouldParseDefaultImport.call(this, e);
					}, i.parseImportSpecifierLocal = function (t, e, s, i) {
						e.local = J(t) ? this.flowParseRestrictedIdentifier(!0) : this.parseIdentifier(), this.checkLVal(e.local, !0, void 0, i), t.specifiers.push(this.finishNode(e, s));
					}, i.parseImportSpecifiers = function (e) {
						e.importKind = "value";var s = null;if (this.match(h._typeof) ? s = "typeof" : this.isContextual("type") && (s = "type"), s) {
							var i = this.lookahead();(H(i) || i.type === h.braceL || i.type === h.star) && (this.next(), e.importKind = s);
						}t.prototype.parseImportSpecifiers.call(this, e);
					}, i.parseImportSpecifier = function (t) {
						var e = this.startNode(),
						    s = this.state.start,
						    i = this.parseIdentifier(!0),
						    r = null;"type" === i.name ? r = "type" : "typeof" === i.name && (r = "typeof");var a = !1;if (this.isContextual("as") && !this.isLookaheadContextual("as")) {
							var n = this.parseIdentifier(!0);null === r || this.match(h.name) || this.state.type.keyword ? (e.imported = i, e.importKind = null, e.local = this.parseIdentifier()) : (e.imported = n, e.importKind = r, e.local = n.__clone());
						} else null !== r && (this.match(h.name) || this.state.type.keyword) ? (e.imported = this.parseIdentifier(!0), e.importKind = r, this.eatContextual("as") ? e.local = this.parseIdentifier() : (a = !0, e.local = e.imported.__clone())) : (a = !0, e.imported = i, e.importKind = null, e.local = e.imported.__clone());var o = J(t),
						    p = J(e);o && p && this.raise(s, "The `type` and `typeof` keywords on named imports can only be used on regular `import` statements. It cannot be used with `import type` or `import typeof` statements"), (o || p) && this.checkReservedType(e.local.name, e.local.start), !a || o || p || this.checkReservedWord(e.local.name, e.start, !0, !0), this.checkLVal(e.local, !0, void 0, "import specifier"), t.specifiers.push(this.finishNode(e, "ImportSpecifier"));
					}, i.parseFunctionParams = function (e) {
						var s = e.kind;"get" !== s && "set" !== s && this.isRelational("<") && (e.typeParameters = this.flowParseTypeParameterDeclaration()), t.prototype.parseFunctionParams.call(this, e);
					}, i.parseVarHead = function (e) {
						t.prototype.parseVarHead.call(this, e), this.match(h.colon) && (e.id.typeAnnotation = this.flowParseTypeAnnotation(), this.finishNode(e.id, e.id.type));
					}, i.parseAsyncArrowFromCallExpression = function (e, s) {
						if (this.match(h.colon)) {
							var i = this.state.noAnonFunctionType;this.state.noAnonFunctionType = !0, e.returnType = this.flowParseTypeAnnotation(), this.state.noAnonFunctionType = i;
						}return t.prototype.parseAsyncArrowFromCallExpression.call(this, e, s);
					}, i.shouldParseAsyncArrow = function () {
						return this.match(h.colon) || t.prototype.shouldParseAsyncArrow.call(this);
					}, i.parseMaybeAssign = function (e, s, i, r) {
						var a = this,
						    n = null;if (h.jsxTagStart && this.match(h.jsxTagStart)) {
							var o = this.state.clone();try {
								return t.prototype.parseMaybeAssign.call(this, e, s, i, r);
							} catch (t) {
								if (!(t instanceof SyntaxError)) throw t;this.state = o, this.state.context.length -= 2, n = t;
							}
						}if (null != n || this.isRelational("<")) {
							var p, c;try {
								c = this.flowParseTypeParameterDeclaration(), (p = this.forwardNoArrowParamsConversionAt(c, function () {
									return t.prototype.parseMaybeAssign.call(a, e, s, i, r);
								})).typeParameters = c, this.resetStartLocationFromNode(p, c);
							} catch (t) {
								throw n || t;
							}if ("ArrowFunctionExpression" === p.type) return p;if (null != n) throw n;this.raise(c.start, "Expected an arrow function after this type parameter declaration");
						}return t.prototype.parseMaybeAssign.call(this, e, s, i, r);
					}, i.parseArrow = function (e) {
						if (this.match(h.colon)) {
							var s = this.state.clone();try {
								var i = this.state.noAnonFunctionType;this.state.noAnonFunctionType = !0;var r = this.startNode(),
								    a = this.flowParseTypeAndPredicateInitialiser();r.typeAnnotation = a[0], e.predicate = a[1], this.state.noAnonFunctionType = i, this.canInsertSemicolon() && this.unexpected(), this.match(h.arrow) || this.unexpected(), e.returnType = r.typeAnnotation ? this.finishNode(r, "TypeAnnotation") : null;
							} catch (t) {
								if (!(t instanceof SyntaxError)) throw t;this.state = s;
							}
						}return t.prototype.parseArrow.call(this, e);
					}, i.shouldParseArrow = function () {
						return this.match(h.colon) || t.prototype.shouldParseArrow.call(this);
					}, i.setArrowFunctionParameters = function (e, s) {
						-1 !== this.state.noArrowParamsConversionAt.indexOf(e.start) ? e.params = s : t.prototype.setArrowFunctionParameters.call(this, e, s);
					}, i.checkFunctionNameAndParams = function (e, s) {
						if (!s || -1 === this.state.noArrowParamsConversionAt.indexOf(e.start)) return t.prototype.checkFunctionNameAndParams.call(this, e, s);
					}, i.parseParenAndDistinguishExpression = function (e) {
						return t.prototype.parseParenAndDistinguishExpression.call(this, e && -1 === this.state.noArrowAt.indexOf(this.state.start));
					}, i.parseSubscripts = function (e, s, i, r) {
						if ("Identifier" === e.type && "async" === e.name && -1 !== this.state.noArrowAt.indexOf(s)) {
							this.next();var a = this.startNodeAt(s, i);a.callee = e, a.arguments = this.parseCallExpressionArguments(h.parenR, !1), e = this.finishNode(a, "CallExpression");
						} else if ("Identifier" === e.type && "async" === e.name && this.isRelational("<")) {
							var n,
							    o = this.state.clone();try {
								var p = this.parseAsyncArrowWithTypeParameters(s, i);if (p) return p;
							} catch (t) {
								n = t;
							}this.state = o;try {
								return t.prototype.parseSubscripts.call(this, e, s, i, r);
							} catch (t) {
								throw n || t;
							}
						}return t.prototype.parseSubscripts.call(this, e, s, i, r);
					}, i.parseAsyncArrowWithTypeParameters = function (t, e) {
						var s = this.startNodeAt(t, e);if (this.parseFunctionParams(s), this.parseArrow(s)) return this.parseArrowExpression(s, void 0, !0);
					}, e;
				}(t);
			}, K.jsx = function (t) {
				return function (t) {
					function e() {
						return t.apply(this, arguments) || this;
					}s(e, t);var i = e.prototype;return i.jsxReadToken = function () {
						for (var t = "", e = this.state.pos;;) {
							this.state.pos >= this.input.length && this.raise(this.state.start, "Unterminated JSX contents");var s = this.input.charCodeAt(this.state.pos);switch (s) {case 60:case 123:
									return this.state.pos === this.state.start ? 60 === s && this.state.exprAllowed ? (++this.state.pos, this.finishToken(h.jsxTagStart)) : this.getTokenFromCode(s) : (t += this.input.slice(e, this.state.pos), this.finishToken(h.jsxText, t));case 38:
									t += this.input.slice(e, this.state.pos), t += this.jsxReadEntity(), e = this.state.pos;break;default:
									A(s) ? (t += this.input.slice(e, this.state.pos), t += this.jsxReadNewLine(!0), e = this.state.pos) : ++this.state.pos;}
						}
					}, i.jsxReadNewLine = function (t) {
						var e,
						    s = this.input.charCodeAt(this.state.pos);return ++this.state.pos, 13 === s && 10 === this.input.charCodeAt(this.state.pos) ? (++this.state.pos, e = t ? "\n" : "\r\n") : e = String.fromCharCode(s), ++this.state.curLine, this.state.lineStart = this.state.pos, e;
					}, i.jsxReadString = function (t) {
						for (var e = "", s = ++this.state.pos;;) {
							this.state.pos >= this.input.length && this.raise(this.state.start, "Unterminated string constant");var i = this.input.charCodeAt(this.state.pos);if (i === t) break;38 === i ? (e += this.input.slice(s, this.state.pos), e += this.jsxReadEntity(), s = this.state.pos) : A(i) ? (e += this.input.slice(s, this.state.pos), e += this.jsxReadNewLine(!1), s = this.state.pos) : ++this.state.pos;
						}return e += this.input.slice(s, this.state.pos++), this.finishToken(h.string, e);
					}, i.jsxReadEntity = function () {
						for (var t, e = "", s = 0, i = this.input[this.state.pos], r = ++this.state.pos; this.state.pos < this.input.length && s++ < 10;) {
							if (";" === (i = this.input[this.state.pos++])) {
								"#" === e[0] ? "x" === e[1] ? (e = e.substr(2), Q.test(e) && (t = String.fromCodePoint(parseInt(e, 16)))) : (e = e.substr(1), Y.test(e) && (t = String.fromCodePoint(parseInt(e, 10)))) : t = z[e];break;
							}e += i;
						}return t || (this.state.pos = r, "&");
					}, i.jsxReadWord = function () {
						var t,
						    e = this.state.pos;do {
							t = this.input.charCodeAt(++this.state.pos);
						} while (b(t) || 45 === t);return this.finishToken(h.jsxName, this.input.slice(e, this.state.pos));
					}, i.jsxParseIdentifier = function () {
						var t = this.startNode();return this.match(h.jsxName) ? t.name = this.state.value : this.state.type.keyword ? t.name = this.state.type.keyword : this.unexpected(), this.next(), this.finishNode(t, "JSXIdentifier");
					}, i.jsxParseNamespacedName = function () {
						var t = this.state.start,
						    e = this.state.startLoc,
						    s = this.jsxParseIdentifier();if (!this.eat(h.colon)) return s;var i = this.startNodeAt(t, e);return i.namespace = s, i.name = this.jsxParseIdentifier(), this.finishNode(i, "JSXNamespacedName");
					}, i.jsxParseElementName = function () {
						for (var t = this.state.start, e = this.state.startLoc, s = this.jsxParseNamespacedName(); this.eat(h.dot);) {
							var i = this.startNodeAt(t, e);i.object = s, i.property = this.jsxParseIdentifier(), s = this.finishNode(i, "JSXMemberExpression");
						}return s;
					}, i.jsxParseAttributeValue = function () {
						var t;switch (this.state.type) {case h.braceL:
								if ("JSXEmptyExpression" === (t = this.jsxParseExpressionContainer()).expression.type) throw this.raise(t.start, "JSX attributes must only be assigned a non-empty expression");return t;case h.jsxTagStart:case h.string:
								return this.parseExprAtom();default:
								throw this.raise(this.state.start, "JSX value should be either an expression or a quoted JSX text");}
					}, i.jsxParseEmptyExpression = function () {
						var t = this.startNodeAt(this.state.lastTokEnd, this.state.lastTokEndLoc);return this.finishNodeAt(t, "JSXEmptyExpression", this.state.start, this.state.startLoc);
					}, i.jsxParseSpreadChild = function () {
						var t = this.startNode();return this.expect(h.braceL), this.expect(h.ellipsis), t.expression = this.parseExpression(), this.expect(h.braceR), this.finishNode(t, "JSXSpreadChild");
					}, i.jsxParseExpressionContainer = function () {
						var t = this.startNode();return this.next(), this.match(h.braceR) ? t.expression = this.jsxParseEmptyExpression() : t.expression = this.parseExpression(), this.expect(h.braceR), this.finishNode(t, "JSXExpressionContainer");
					}, i.jsxParseAttribute = function () {
						var t = this.startNode();return this.eat(h.braceL) ? (this.expect(h.ellipsis), t.argument = this.parseMaybeAssign(), this.expect(h.braceR), this.finishNode(t, "JSXSpreadAttribute")) : (t.name = this.jsxParseNamespacedName(), t.value = this.eat(h.eq) ? this.jsxParseAttributeValue() : null, this.finishNode(t, "JSXAttribute"));
					}, i.jsxParseOpeningElementAt = function (t, e) {
						var s = this.startNodeAt(t, e);if (this.match(h.jsxTagEnd)) return this.expect(h.jsxTagEnd), this.finishNode(s, "JSXOpeningFragment");for (s.attributes = [], s.name = this.jsxParseElementName(); !this.match(h.slash) && !this.match(h.jsxTagEnd);) {
							s.attributes.push(this.jsxParseAttribute());
						}return s.selfClosing = this.eat(h.slash), this.expect(h.jsxTagEnd), this.finishNode(s, "JSXOpeningElement");
					}, i.jsxParseClosingElementAt = function (t, e) {
						var s = this.startNodeAt(t, e);return this.match(h.jsxTagEnd) ? (this.expect(h.jsxTagEnd), this.finishNode(s, "JSXClosingFragment")) : (s.name = this.jsxParseElementName(), this.expect(h.jsxTagEnd), this.finishNode(s, "JSXClosingElement"));
					}, i.jsxParseElementAt = function (t, e) {
						var s = this.startNodeAt(t, e),
						    i = [],
						    r = this.jsxParseOpeningElementAt(t, e),
						    a = null;if (!r.selfClosing) {
							t: for (;;) {
								switch (this.state.type) {case h.jsxTagStart:
										if (t = this.state.start, e = this.state.startLoc, this.next(), this.eat(h.slash)) {
											a = this.jsxParseClosingElementAt(t, e);break t;
										}i.push(this.jsxParseElementAt(t, e));break;case h.jsxText:
										i.push(this.parseExprAtom());break;case h.braceL:
										this.lookahead().type === h.ellipsis ? i.push(this.jsxParseSpreadChild()) : i.push(this.jsxParseExpressionContainer());break;default:
										throw this.unexpected();}
							}Z(r) && !Z(a) ? this.raise(a.start, "Expected corresponding JSX closing tag for <>") : !Z(r) && Z(a) ? this.raise(a.start, "Expected corresponding JSX closing tag for <" + tt(r.name) + ">") : Z(r) || Z(a) || tt(a.name) !== tt(r.name) && this.raise(a.start, "Expected corresponding JSX closing tag for <" + tt(r.name) + ">");
						}return Z(r) ? (s.openingFragment = r, s.closingFragment = a) : (s.openingElement = r, s.closingElement = a), s.children = i, this.match(h.relational) && "<" === this.state.value && this.raise(this.state.start, "Adjacent JSX elements must be wrapped in an enclosing tag"), Z(r) ? this.finishNode(s, "JSXFragment") : this.finishNode(s, "JSXElement");
					}, i.jsxParseElement = function () {
						var t = this.state.start,
						    e = this.state.startLoc;return this.next(), this.jsxParseElementAt(t, e);
					}, i.parseExprAtom = function (e) {
						return this.match(h.jsxText) ? this.parseLiteral(this.state.value, "JSXText") : this.match(h.jsxTagStart) ? this.jsxParseElement() : t.prototype.parseExprAtom.call(this, e);
					}, i.readToken = function (e) {
						if (this.state.inPropertyName) return t.prototype.readToken.call(this, e);var s = this.curContext();if (s === E.j_expr) return this.jsxReadToken();if (s === E.j_oTag || s === E.j_cTag) {
							if (g(e)) return this.jsxReadWord();if (62 === e) return ++this.state.pos, this.finishToken(h.jsxTagEnd);if ((34 === e || 39 === e) && s === E.j_oTag) return this.jsxReadString(e);
						}return 60 === e && this.state.exprAllowed ? (++this.state.pos, this.finishToken(h.jsxTagStart)) : t.prototype.readToken.call(this, e);
					}, i.updateContext = function (e) {
						if (this.match(h.braceL)) {
							var s = this.curContext();s === E.j_oTag ? this.state.context.push(E.braceExpression) : s === E.j_expr ? this.state.context.push(E.templateQuasi) : t.prototype.updateContext.call(this, e), this.state.exprAllowed = !0;
						} else {
							if (!this.match(h.slash) || e !== h.jsxTagStart) return t.prototype.updateContext.call(this, e);this.state.context.length -= 2, this.state.context.push(E.j_cTag), this.state.exprAllowed = !1;
						}
					}, e;
				}(t);
			}, K.typescript = function (t) {
				return function (t) {
					function e() {
						return t.apply(this, arguments) || this;
					}s(e, t);var i = e.prototype;return i.tsIsIdentifier = function () {
						return this.match(h.name);
					}, i.tsNextTokenCanFollowModifier = function () {
						return this.next(), !(this.hasPrecedingLineBreak() || this.match(h.parenL) || this.match(h.colon) || this.match(h.eq) || this.match(h.question));
					}, i.tsParseModifier = function (t) {
						if (this.match(h.name)) {
							var e = this.state.value;return -1 !== t.indexOf(e) && this.tsTryParse(this.tsNextTokenCanFollowModifier.bind(this)) ? e : void 0;
						}
					}, i.tsIsListTerminator = function (t) {
						switch (t) {case "EnumMembers":case "TypeMembers":
								return this.match(h.braceR);case "HeritageClauseElement":
								return this.match(h.braceL);case "TupleElementTypes":
								return this.match(h.bracketR);case "TypeParametersOrArguments":
								return this.isRelational(">");}throw new Error("Unreachable");
					}, i.tsParseList = function (t, e) {
						for (var s = []; !this.tsIsListTerminator(t);) {
							s.push(e());
						}return s;
					}, i.tsParseDelimitedList = function (t, e) {
						return et(this.tsParseDelimitedListWorker(t, e, !0));
					}, i.tsTryParseDelimitedList = function (t, e) {
						return this.tsParseDelimitedListWorker(t, e, !1);
					}, i.tsParseDelimitedListWorker = function (t, e, s) {
						for (var i = []; !this.tsIsListTerminator(t);) {
							var r = e();if (null == r) return;if (i.push(r), !this.eat(h.comma)) {
								if (this.tsIsListTerminator(t)) break;return void (s && this.expect(h.comma));
							}
						}return i;
					}, i.tsParseBracketedList = function (t, e, s, i) {
						i || (s ? this.expect(h.bracketL) : this.expectRelational("<"));var r = this.tsParseDelimitedList(t, e);return s ? this.expect(h.bracketR) : this.expectRelational(">"), r;
					}, i.tsParseEntityName = function (t) {
						for (var e = this.parseIdentifier(); this.eat(h.dot);) {
							var s = this.startNodeAtNode(e);s.left = e, s.right = this.parseIdentifier(t), e = this.finishNode(s, "TSQualifiedName");
						}return e;
					}, i.tsParseTypeReference = function () {
						var t = this.startNode();return t.typeName = this.tsParseEntityName(!1), !this.hasPrecedingLineBreak() && this.isRelational("<") && (t.typeParameters = this.tsParseTypeArguments()), this.finishNode(t, "TSTypeReference");
					}, i.tsParseThisTypePredicate = function (t) {
						this.next();var e = this.startNode();return e.parameterName = t, e.typeAnnotation = this.tsParseTypeAnnotation(!1), this.finishNode(e, "TSTypePredicate");
					}, i.tsParseThisTypeNode = function () {
						var t = this.startNode();return this.next(), this.finishNode(t, "TSThisType");
					}, i.tsParseTypeQuery = function () {
						var t = this.startNode();return this.expect(h._typeof), t.exprName = this.tsParseEntityName(!0), this.finishNode(t, "TSTypeQuery");
					}, i.tsParseTypeParameter = function () {
						var t = this.startNode();return t.name = this.parseIdentifierName(t.start), this.eat(h._extends) && (t.constraint = this.tsParseType()), this.eat(h.eq) && (t.default = this.tsParseType()), this.finishNode(t, "TSTypeParameter");
					}, i.tsTryParseTypeParameters = function () {
						if (this.isRelational("<")) return this.tsParseTypeParameters();
					}, i.tsParseTypeParameters = function () {
						var t = this.startNode();return this.isRelational("<") || this.match(h.jsxTagStart) ? this.next() : this.unexpected(), t.params = this.tsParseBracketedList("TypeParametersOrArguments", this.tsParseTypeParameter.bind(this), !1, !0), this.finishNode(t, "TSTypeParameterDeclaration");
					}, i.tsFillSignature = function (t, e) {
						var s = t === h.arrow;e.typeParameters = this.tsTryParseTypeParameters(), this.expect(h.parenL), e.parameters = this.tsParseBindingListForSignature(), s ? e.typeAnnotation = this.tsParseTypeOrTypePredicateAnnotation(t) : this.match(t) && (e.typeAnnotation = this.tsParseTypeOrTypePredicateAnnotation(t));
					}, i.tsParseBindingListForSignature = function () {
						var t = this;return this.parseBindingList(h.parenR).map(function (e) {
							if ("Identifier" !== e.type && "RestElement" !== e.type) throw t.unexpected(e.start, "Name in a signature must be an Identifier.");return e;
						});
					}, i.tsParseTypeMemberSemicolon = function () {
						this.eat(h.comma) || this.semicolon();
					}, i.tsParseSignatureMember = function (t) {
						var e = this.startNode();return "TSConstructSignatureDeclaration" === t && this.expect(h._new), this.tsFillSignature(h.colon, e), this.tsParseTypeMemberSemicolon(), this.finishNode(e, t);
					}, i.tsIsUnambiguouslyIndexSignature = function () {
						return this.next(), this.eat(h.name) && this.match(h.colon);
					}, i.tsTryParseIndexSignature = function (t) {
						if (this.match(h.bracketL) && this.tsLookAhead(this.tsIsUnambiguouslyIndexSignature.bind(this))) {
							this.expect(h.bracketL);var e = this.parseIdentifier();this.expect(h.colon), e.typeAnnotation = this.tsParseTypeAnnotation(!1), this.expect(h.bracketR), t.parameters = [e];var s = this.tsTryParseTypeAnnotation();return s && (t.typeAnnotation = s), this.tsParseTypeMemberSemicolon(), this.finishNode(t, "TSIndexSignature");
						}
					}, i.tsParsePropertyOrMethodSignature = function (t, e) {
						this.parsePropertyName(t), this.eat(h.question) && (t.optional = !0);var s = t;if (e || !this.match(h.parenL) && !this.isRelational("<")) {
							var i = s;e && (i.readonly = !0);var r = this.tsTryParseTypeAnnotation();return r && (i.typeAnnotation = r), this.tsParseTypeMemberSemicolon(), this.finishNode(i, "TSPropertySignature");
						}var a = s;return this.tsFillSignature(h.colon, a), this.tsParseTypeMemberSemicolon(), this.finishNode(a, "TSMethodSignature");
					}, i.tsParseTypeMember = function () {
						if (this.match(h.parenL) || this.isRelational("<")) return this.tsParseSignatureMember("TSCallSignatureDeclaration");if (this.match(h._new) && this.tsLookAhead(this.tsIsStartOfConstructSignature.bind(this))) return this.tsParseSignatureMember("TSConstructSignatureDeclaration");var t = this.startNode(),
						    e = !!this.tsParseModifier(["readonly"]),
						    s = this.tsTryParseIndexSignature(t);return s ? (e && (t.readonly = !0), s) : this.tsParsePropertyOrMethodSignature(t, e);
					}, i.tsIsStartOfConstructSignature = function () {
						return this.next(), this.match(h.parenL) || this.isRelational("<");
					}, i.tsParseTypeLiteral = function () {
						var t = this.startNode();return t.members = this.tsParseObjectTypeMembers(), this.finishNode(t, "TSTypeLiteral");
					}, i.tsParseObjectTypeMembers = function () {
						this.expect(h.braceL);var t = this.tsParseList("TypeMembers", this.tsParseTypeMember.bind(this));return this.expect(h.braceR), t;
					}, i.tsIsStartOfMappedType = function () {
						return this.next(), this.isContextual("readonly") && this.next(), !!this.match(h.bracketL) && (this.next(), !!this.tsIsIdentifier() && (this.next(), this.match(h._in)));
					}, i.tsParseMappedTypeParameter = function () {
						var t = this.startNode();return t.name = this.parseIdentifierName(t.start), this.expect(h._in), t.constraint = this.tsParseType(), this.finishNode(t, "TSTypeParameter");
					}, i.tsParseMappedType = function () {
						var t = this.startNode();return this.expect(h.braceL), this.eatContextual("readonly") && (t.readonly = !0), this.expect(h.bracketL), t.typeParameter = this.tsParseMappedTypeParameter(), this.expect(h.bracketR), this.eat(h.question) && (t.optional = !0), t.typeAnnotation = this.tsTryParseType(), this.semicolon(), this.expect(h.braceR), this.finishNode(t, "TSMappedType");
					}, i.tsParseTupleType = function () {
						var t = this.startNode();return t.elementTypes = this.tsParseBracketedList("TupleElementTypes", this.tsParseType.bind(this), !0, !1), this.finishNode(t, "TSTupleType");
					}, i.tsParseParenthesizedType = function () {
						var t = this.startNode();return this.expect(h.parenL), t.typeAnnotation = this.tsParseType(), this.expect(h.parenR), this.finishNode(t, "TSParenthesizedType");
					}, i.tsParseFunctionOrConstructorType = function (t) {
						var e = this.startNode();return "TSConstructorType" === t && this.expect(h._new), this.tsFillSignature(h.arrow, e), this.finishNode(e, t);
					}, i.tsParseLiteralTypeNode = function () {
						var t = this,
						    e = this.startNode();return e.literal = function () {
							switch (t.state.type) {case h.num:
									return t.parseLiteral(t.state.value, "NumericLiteral");case h.string:
									return t.parseLiteral(t.state.value, "StringLiteral");case h._true:case h._false:
									return t.parseBooleanLiteral();default:
									throw t.unexpected();}
						}(), this.finishNode(e, "TSLiteralType");
					}, i.tsParseNonArrayType = function () {
						switch (this.state.type) {case h.name:case h._void:case h._null:
								var t = this.match(h._void) ? "TSVoidKeyword" : this.match(h._null) ? "TSNullKeyword" : function (t) {
									switch (t) {case "any":
											return "TSAnyKeyword";case "boolean":
											return "TSBooleanKeyword";case "never":
											return "TSNeverKeyword";case "number":
											return "TSNumberKeyword";case "object":
											return "TSObjectKeyword";case "string":
											return "TSStringKeyword";case "symbol":
											return "TSSymbolKeyword";case "undefined":
											return "TSUndefinedKeyword";default:
											return;}
								}(this.state.value);if (void 0 !== t && this.lookahead().type !== h.dot) {
									var e = this.startNode();return this.next(), this.finishNode(e, t);
								}return this.tsParseTypeReference();case h.string:case h.num:case h._true:case h._false:
								return this.tsParseLiteralTypeNode();case h.plusMin:
								if ("-" === this.state.value) {
									var s = this.startNode();if (this.next(), !this.match(h.num)) throw this.unexpected();return s.literal = this.parseLiteral(-this.state.value, "NumericLiteral", s.start, s.loc.start), this.finishNode(s, "TSLiteralType");
								}break;case h._this:
								var i = this.tsParseThisTypeNode();return this.isContextual("is") && !this.hasPrecedingLineBreak() ? this.tsParseThisTypePredicate(i) : i;case h._typeof:
								return this.tsParseTypeQuery();case h.braceL:
								return this.tsLookAhead(this.tsIsStartOfMappedType.bind(this)) ? this.tsParseMappedType() : this.tsParseTypeLiteral();case h.bracketL:
								return this.tsParseTupleType();case h.parenL:
								return this.tsParseParenthesizedType();}throw this.unexpected();
					}, i.tsParseArrayTypeOrHigher = function () {
						for (var t = this.tsParseNonArrayType(); !this.hasPrecedingLineBreak() && this.eat(h.bracketL);) {
							if (this.match(h.bracketR)) {
								var e = this.startNodeAtNode(t);e.elementType = t, this.expect(h.bracketR), t = this.finishNode(e, "TSArrayType");
							} else {
								var s = this.startNodeAtNode(t);s.objectType = t, s.indexType = this.tsParseType(), this.expect(h.bracketR), t = this.finishNode(s, "TSIndexedAccessType");
							}
						}return t;
					}, i.tsParseTypeOperator = function (t) {
						var e = this.startNode();return this.expectContextual(t), e.operator = t, e.typeAnnotation = this.tsParseTypeOperatorOrHigher(), this.finishNode(e, "TSTypeOperator");
					}, i.tsParseTypeOperatorOrHigher = function () {
						return this.isContextual("keyof") ? this.tsParseTypeOperator("keyof") : this.tsParseArrayTypeOrHigher();
					}, i.tsParseUnionOrIntersectionType = function (t, e, s) {
						this.eat(s);var i = e();if (this.match(s)) {
							for (var r = [i]; this.eat(s);) {
								r.push(e());
							}var a = this.startNodeAtNode(i);a.types = r, i = this.finishNode(a, t);
						}return i;
					}, i.tsParseIntersectionTypeOrHigher = function () {
						return this.tsParseUnionOrIntersectionType("TSIntersectionType", this.tsParseTypeOperatorOrHigher.bind(this), h.bitwiseAND);
					}, i.tsParseUnionTypeOrHigher = function () {
						return this.tsParseUnionOrIntersectionType("TSUnionType", this.tsParseIntersectionTypeOrHigher.bind(this), h.bitwiseOR);
					}, i.tsIsStartOfFunctionType = function () {
						return !!this.isRelational("<") || this.match(h.parenL) && this.tsLookAhead(this.tsIsUnambiguouslyStartOfFunctionType.bind(this));
					}, i.tsSkipParameterStart = function () {
						return !(!this.match(h.name) && !this.match(h._this) || (this.next(), 0));
					}, i.tsIsUnambiguouslyStartOfFunctionType = function () {
						if (this.next(), this.match(h.parenR) || this.match(h.ellipsis)) return !0;if (this.tsSkipParameterStart()) {
							if (this.match(h.colon) || this.match(h.comma) || this.match(h.question) || this.match(h.eq)) return !0;if (this.match(h.parenR) && (this.next(), this.match(h.arrow))) return !0;
						}return !1;
					}, i.tsParseTypeOrTypePredicateAnnotation = function (t) {
						var e = this.startNode();this.expect(t);var s = this.tsIsIdentifier() && this.tsTryParse(this.tsParseTypePredicatePrefix.bind(this));if (!s) return this.tsParseTypeAnnotation(!1, e);var i = this.tsParseTypeAnnotation(!1),
						    r = this.startNodeAtNode(s);return r.parameterName = s, r.typeAnnotation = i, e.typeAnnotation = this.finishNode(r, "TSTypePredicate"), this.finishNode(e, "TSTypeAnnotation");
					}, i.tsTryParseTypeOrTypePredicateAnnotation = function () {
						return this.match(h.colon) ? this.tsParseTypeOrTypePredicateAnnotation(h.colon) : void 0;
					}, i.tsTryParseTypeAnnotation = function () {
						return this.match(h.colon) ? this.tsParseTypeAnnotation() : void 0;
					}, i.tsTryParseType = function () {
						return this.eat(h.colon) ? this.tsParseType() : void 0;
					}, i.tsParseTypePredicatePrefix = function () {
						var t = this.parseIdentifier();if (this.isContextual("is") && !this.hasPrecedingLineBreak()) return this.next(), t;
					}, i.tsParseTypeAnnotation = function (t, e) {
						return void 0 === t && (t = !0), void 0 === e && (e = this.startNode()), t && this.expect(h.colon), e.typeAnnotation = this.tsParseType(), this.finishNode(e, "TSTypeAnnotation");
					}, i.tsParseType = function () {
						var t = this.state.inType;this.state.inType = !0;try {
							return this.tsIsStartOfFunctionType() ? this.tsParseFunctionOrConstructorType("TSFunctionType") : this.match(h._new) ? this.tsParseFunctionOrConstructorType("TSConstructorType") : this.tsParseUnionTypeOrHigher();
						} finally {
							this.state.inType = t;
						}
					}, i.tsParseTypeAssertion = function () {
						var t = this.startNode();return t.typeAnnotation = this.tsParseType(), this.expectRelational(">"), t.expression = this.parseMaybeUnary(), this.finishNode(t, "TSTypeAssertion");
					}, i.tsTryParseTypeArgumentsInExpression = function () {
						var t = this;return this.tsTryParseAndCatch(function () {
							var e = t.startNode();t.expectRelational("<");var s = t.tsParseDelimitedList("TypeParametersOrArguments", t.tsParseType.bind(t));return t.expectRelational(">"), e.params = s, t.finishNode(e, "TSTypeParameterInstantiation"), t.expect(h.parenL), e;
						});
					}, i.tsParseHeritageClause = function () {
						return this.tsParseDelimitedList("HeritageClauseElement", this.tsParseExpressionWithTypeArguments.bind(this));
					}, i.tsParseExpressionWithTypeArguments = function () {
						var t = this.startNode();return t.expression = this.tsParseEntityName(!1), this.isRelational("<") && (t.typeParameters = this.tsParseTypeArguments()), this.finishNode(t, "TSExpressionWithTypeArguments");
					}, i.tsParseInterfaceDeclaration = function (t) {
						t.id = this.parseIdentifier(), t.typeParameters = this.tsTryParseTypeParameters(), this.eat(h._extends) && (t.extends = this.tsParseHeritageClause());var e = this.startNode();return e.body = this.tsParseObjectTypeMembers(), t.body = this.finishNode(e, "TSInterfaceBody"), this.finishNode(t, "TSInterfaceDeclaration");
					}, i.tsParseTypeAliasDeclaration = function (t) {
						return t.id = this.parseIdentifier(), t.typeParameters = this.tsTryParseTypeParameters(), this.expect(h.eq), t.typeAnnotation = this.tsParseType(), this.semicolon(), this.finishNode(t, "TSTypeAliasDeclaration");
					}, i.tsParseEnumMember = function () {
						var t = this.startNode();return t.id = this.match(h.string) ? this.parseLiteral(this.state.value, "StringLiteral") : this.parseIdentifier(!0), this.eat(h.eq) && (t.initializer = this.parseMaybeAssign()), this.finishNode(t, "TSEnumMember");
					}, i.tsParseEnumDeclaration = function (t, e) {
						return e && (t.const = !0), t.id = this.parseIdentifier(), this.expect(h.braceL), t.members = this.tsParseDelimitedList("EnumMembers", this.tsParseEnumMember.bind(this)), this.expect(h.braceR), this.finishNode(t, "TSEnumDeclaration");
					}, i.tsParseModuleBlock = function () {
						var t = this.startNode();return this.expect(h.braceL), this.parseBlockOrModuleBlockBody(t.body = [], void 0, !0, h.braceR), this.finishNode(t, "TSModuleBlock");
					}, i.tsParseModuleOrNamespaceDeclaration = function (t) {
						if (t.id = this.parseIdentifier(), this.eat(h.dot)) {
							var e = this.startNode();this.tsParseModuleOrNamespaceDeclaration(e), t.body = e;
						} else t.body = this.tsParseModuleBlock();return this.finishNode(t, "TSModuleDeclaration");
					}, i.tsParseAmbientExternalModuleDeclaration = function (t) {
						return this.isContextual("global") ? (t.global = !0, t.id = this.parseIdentifier()) : this.match(h.string) ? t.id = this.parseExprAtom() : this.unexpected(), this.match(h.braceL) ? t.body = this.tsParseModuleBlock() : this.semicolon(), this.finishNode(t, "TSModuleDeclaration");
					}, i.tsParseImportEqualsDeclaration = function (t, e) {
						return t.isExport = e || !1, t.id = this.parseIdentifier(), this.expect(h.eq), t.moduleReference = this.tsParseModuleReference(), this.semicolon(), this.finishNode(t, "TSImportEqualsDeclaration");
					}, i.tsIsExternalModuleReference = function () {
						return this.isContextual("require") && this.lookahead().type === h.parenL;
					}, i.tsParseModuleReference = function () {
						return this.tsIsExternalModuleReference() ? this.tsParseExternalModuleReference() : this.tsParseEntityName(!1);
					}, i.tsParseExternalModuleReference = function () {
						var t = this.startNode();if (this.expectContextual("require"), this.expect(h.parenL), !this.match(h.string)) throw this.unexpected();return t.expression = this.parseLiteral(this.state.value, "StringLiteral"), this.expect(h.parenR), this.finishNode(t, "TSExternalModuleReference");
					}, i.tsLookAhead = function (t) {
						var e = this.state.clone(),
						    s = t();return this.state = e, s;
					}, i.tsTryParseAndCatch = function (t) {
						var e = this.state.clone();try {
							return t();
						} catch (t) {
							if (t instanceof SyntaxError) return void (this.state = e);throw t;
						}
					}, i.tsTryParse = function (t) {
						var e = this.state.clone(),
						    s = t();return void 0 !== s && !1 !== s ? s : void (this.state = e);
					}, i.nodeWithSamePosition = function (t, e) {
						var s = this.startNodeAtNode(t);return s.type = e, s.end = t.end, s.loc.end = t.loc.end, t.leadingComments && (s.leadingComments = t.leadingComments), t.trailingComments && (s.trailingComments = t.trailingComments), t.innerComments && (s.innerComments = t.innerComments), s;
					}, i.tsTryParseDeclare = function (t) {
						switch (this.state.type) {case h._function:
								return this.next(), this.parseFunction(t, !0);case h._class:
								return this.parseClass(t, !0, !1);case h._const:
								if (this.match(h._const) && this.isLookaheadContextual("enum")) return this.expect(h._const), this.expectContextual("enum"), this.tsParseEnumDeclaration(t, !0);case h._var:case h._let:
								return this.parseVarStatement(t, this.state.type);case h.name:
								var e = this.state.value;return "global" === e ? this.tsParseAmbientExternalModuleDeclaration(t) : this.tsParseDeclaration(t, e, !0);}
					}, i.tsTryParseExportDeclaration = function () {
						return this.tsParseDeclaration(this.startNode(), this.state.value, !0);
					}, i.tsParseExpressionStatement = function (t, e) {
						switch (e.name) {case "declare":
								var s = this.tsTryParseDeclare(t);if (s) return s.declare = !0, s;break;case "global":
								if (this.match(h.braceL)) {
									var i = t;return i.global = !0, i.id = e, i.body = this.tsParseModuleBlock(), this.finishNode(i, "TSModuleDeclaration");
								}break;default:
								return this.tsParseDeclaration(t, e.name, !1);}
					}, i.tsParseDeclaration = function (t, e, s) {
						switch (e) {case "abstract":
								if (s || this.match(h._class)) {
									var i = t;return i.abstract = !0, s && this.next(), this.parseClass(i, !0, !1);
								}break;case "enum":
								if (s || this.match(h.name)) return s && this.next(), this.tsParseEnumDeclaration(t, !1);break;case "interface":
								if (s || this.match(h.name)) return s && this.next(), this.tsParseInterfaceDeclaration(t);break;case "module":
								if (s && this.next(), this.match(h.string)) return this.tsParseAmbientExternalModuleDeclaration(t);if (s || this.match(h.name)) return this.tsParseModuleOrNamespaceDeclaration(t);break;case "namespace":
								if (s || this.match(h.name)) return s && this.next(), this.tsParseModuleOrNamespaceDeclaration(t);break;case "type":
								if (s || this.match(h.name)) return s && this.next(), this.tsParseTypeAliasDeclaration(t);}
					}, i.tsTryParseGenericAsyncArrowFunction = function (e, s) {
						var i = this,
						    r = this.tsTryParseAndCatch(function () {
							var r = i.startNodeAt(e, s);return r.typeParameters = i.tsParseTypeParameters(), t.prototype.parseFunctionParams.call(i, r), r.returnType = i.tsTryParseTypeOrTypePredicateAnnotation(), i.expect(h.arrow), r;
						});if (r) return r.id = null, r.generator = !1, r.expression = !0, r.async = !0, this.parseFunctionBody(r, !0), this.finishNode(r, "ArrowFunctionExpression");
					}, i.tsParseTypeArguments = function () {
						var t = this.startNode();return this.expectRelational("<"), t.params = this.tsParseDelimitedList("TypeParametersOrArguments", this.tsParseType.bind(this)), this.expectRelational(">"), this.finishNode(t, "TSTypeParameterInstantiation");
					}, i.tsIsDeclarationStart = function () {
						if (this.match(h.name)) switch (this.state.value) {case "abstract":case "declare":case "enum":case "interface":case "module":case "namespace":case "type":
								return !0;}return !1;
					}, i.isExportDefaultSpecifier = function () {
						return !this.tsIsDeclarationStart() && t.prototype.isExportDefaultSpecifier.call(this);
					}, i.parseAssignableListItem = function (t, e) {
						var s,
						    i = !1;t && (s = this.parseAccessModifier(), i = !!this.tsParseModifier(["readonly"]));var r = this.parseMaybeDefault();this.parseAssignableListItemTypes(r);var a = this.parseMaybeDefault(r.start, r.loc.start, r);if (s || i) {
							var n = this.startNodeAtNode(a);if (e.length && (n.decorators = e), s && (n.accessibility = s), i && (n.readonly = i), "Identifier" !== a.type && "AssignmentPattern" !== a.type) throw this.raise(n.start, "A parameter property may not be declared using a binding pattern.");return n.parameter = a, this.finishNode(n, "TSParameterProperty");
						}return e.length && (r.decorators = e), a;
					}, i.parseFunctionBodyAndFinish = function (e, s, i) {
						!i && this.match(h.colon) && (e.returnType = this.tsParseTypeOrTypePredicateAnnotation(h.colon));var r = "FunctionDeclaration" === s ? "TSDeclareFunction" : "ClassMethod" === s ? "TSDeclareMethod" : void 0;r && !this.match(h.braceL) && this.isLineTerminator() ? this.finishNode(e, r) : t.prototype.parseFunctionBodyAndFinish.call(this, e, s, i);
					}, i.parseSubscript = function (e, s, i, r, a) {
						if (this.eat(h.bang)) {
							var n = this.startNodeAt(s, i);return n.expression = e, this.finishNode(n, "TSNonNullExpression");
						}if (!r && this.isRelational("<")) {
							if (this.atPossibleAsync(e)) {
								var o = this.tsTryParseGenericAsyncArrowFunction(s, i);if (o) return o;
							}var p = this.startNodeAt(s, i);p.callee = e;var c = this.tsTryParseTypeArgumentsInExpression();if (c) return p.arguments = this.parseCallExpressionArguments(h.parenR, !1), p.typeParameters = c, this.finishCallExpression(p);
						}return t.prototype.parseSubscript.call(this, e, s, i, r, a);
					}, i.parseNewArguments = function (e) {
						var s = this;if (this.isRelational("<")) {
							var i = this.tsTryParseAndCatch(function () {
								var t = s.tsParseTypeArguments();return s.match(h.parenL) || s.unexpected(), t;
							});i && (e.typeParameters = i);
						}t.prototype.parseNewArguments.call(this, e);
					}, i.parseExprOp = function (e, s, i, r, a) {
						if (et(h._in.binop) > r && !this.hasPrecedingLineBreak() && this.eatContextual("as")) {
							var n = this.startNodeAt(s, i);return n.expression = e, n.typeAnnotation = this.tsParseType(), this.finishNode(n, "TSAsExpression"), this.parseExprOp(n, s, i, r, a);
						}return t.prototype.parseExprOp.call(this, e, s, i, r, a);
					}, i.checkReservedWord = function (t, e, s, i) {}, i.checkDuplicateExports = function () {}, i.parseImport = function (e) {
						return this.match(h.name) && this.lookahead().type === h.eq ? this.tsParseImportEqualsDeclaration(e) : t.prototype.parseImport.call(this, e);
					}, i.parseExport = function (e) {
						if (this.match(h._import)) return this.expect(h._import), this.tsParseImportEqualsDeclaration(e, !0);if (this.eat(h.eq)) {
							var s = e;return s.expression = this.parseExpression(), this.semicolon(), this.finishNode(s, "TSExportAssignment");
						}if (this.eatContextual("as")) {
							var i = e;return this.expectContextual("namespace"), i.id = this.parseIdentifier(), this.semicolon(), this.finishNode(i, "TSNamespaceExportDeclaration");
						}return t.prototype.parseExport.call(this, e);
					}, i.parseStatementContent = function (e, s) {
						if (this.state.type === h._const) {
							var i = this.lookahead();if (i.type === h.name && "enum" === i.value) {
								var r = this.startNode();return this.expect(h._const), this.expectContextual("enum"), this.tsParseEnumDeclaration(r, !0);
							}
						}return t.prototype.parseStatementContent.call(this, e, s);
					}, i.parseAccessModifier = function () {
						return this.tsParseModifier(["public", "protected", "private"]);
					}, i.parseClassMember = function (e, s, i) {
						var r = this.parseAccessModifier();r && (s.accessibility = r), t.prototype.parseClassMember.call(this, e, s, i);
					}, i.parseClassMemberWithIsStatic = function (e, s, i, r) {
						var a = s,
						    n = s,
						    o = s,
						    h = !1,
						    p = !1;switch (this.tsParseModifier(["abstract", "readonly"])) {case "readonly":
								p = !0, h = !!this.tsParseModifier(["abstract"]);break;case "abstract":
								h = !0, p = !!this.tsParseModifier(["readonly"]);}if (h && (a.abstract = !0), p && (o.readonly = !0), !h && !r && !a.accessibility) {
							var c = this.tsTryParseIndexSignature(s);if (c) return void e.body.push(c);
						}if (p) return a.static = r, this.parseClassPropertyName(n), this.parsePostMemberNameModifiers(a), void this.pushClassProperty(e, n);t.prototype.parseClassMemberWithIsStatic.call(this, e, s, i, r);
					}, i.parsePostMemberNameModifiers = function (t) {
						this.eat(h.question) && (t.optional = !0);
					}, i.parseExpressionStatement = function (e, s) {
						return ("Identifier" === s.type ? this.tsParseExpressionStatement(e, s) : void 0) || t.prototype.parseExpressionStatement.call(this, e, s);
					}, i.shouldParseExportDeclaration = function () {
						return !!this.tsIsDeclarationStart() || t.prototype.shouldParseExportDeclaration.call(this);
					}, i.parseConditional = function (e, s, i, r, a) {
						if (!a || !this.match(h.question)) return t.prototype.parseConditional.call(this, e, s, i, r, a);var n = this.state.clone();try {
							return t.prototype.parseConditional.call(this, e, s, i, r);
						} catch (t) {
							if (!(t instanceof SyntaxError)) throw t;return this.state = n, a.start = t.pos || this.state.start, e;
						}
					}, i.parseParenItem = function (e, s, i) {
						if (e = t.prototype.parseParenItem.call(this, e, s, i), this.eat(h.question) && (e.optional = !0), this.match(h.colon)) {
							var r = this.startNodeAt(s, i);return r.expression = e, r.typeAnnotation = this.tsParseTypeAnnotation(), this.finishNode(r, "TSTypeCastExpression");
						}return e;
					}, i.parseExportDeclaration = function (e) {
						var s,
						    i = this.eatContextual("declare");return this.match(h.name) && (s = this.tsTryParseExportDeclaration()), s || (s = t.prototype.parseExportDeclaration.call(this, e)), s && i && (s.declare = !0), s;
					}, i.parseClassId = function (e, s, i) {
						var r;if (s && !i || !this.isContextual("implements")) {
							(r = t.prototype.parseClassId).call.apply(r, [this].concat(Array.prototype.slice.call(arguments)));var a = this.tsTryParseTypeParameters();a && (e.typeParameters = a);
						}
					}, i.parseClassProperty = function (e) {
						var s = this.tsTryParseTypeAnnotation();return s && (e.typeAnnotation = s), t.prototype.parseClassProperty.call(this, e);
					}, i.pushClassMethod = function (e, s, i, r, a) {
						var n = this.tsTryParseTypeParameters();n && (s.typeParameters = n), t.prototype.pushClassMethod.call(this, e, s, i, r, a);
					}, i.pushClassPrivateMethod = function (e, s, i, r) {
						var a = this.tsTryParseTypeParameters();a && (s.typeParameters = a), t.prototype.pushClassPrivateMethod.call(this, e, s, i, r);
					}, i.parseClassSuper = function (e) {
						t.prototype.parseClassSuper.call(this, e), e.superClass && this.isRelational("<") && (e.superTypeParameters = this.tsParseTypeArguments()), this.eatContextual("implements") && (e.implements = this.tsParseHeritageClause());
					}, i.parseObjPropValue = function (e) {
						var s;if (this.isRelational("<")) throw new Error("TODO");for (var i = arguments.length, r = new Array(i > 1 ? i - 1 : 0), a = 1; a < i; a++) {
							r[a - 1] = arguments[a];
						}(s = t.prototype.parseObjPropValue).call.apply(s, [this, e].concat(r));
					}, i.parseFunctionParams = function (e, s) {
						var i = this.tsTryParseTypeParameters();i && (e.typeParameters = i), t.prototype.parseFunctionParams.call(this, e, s);
					}, i.parseVarHead = function (e) {
						t.prototype.parseVarHead.call(this, e);var s = this.tsTryParseTypeAnnotation();s && (e.id.typeAnnotation = s, this.finishNode(e.id, e.id.type));
					}, i.parseAsyncArrowFromCallExpression = function (e, s) {
						return this.match(h.colon) && (e.returnType = this.tsParseTypeAnnotation()), t.prototype.parseAsyncArrowFromCallExpression.call(this, e, s);
					}, i.parseMaybeAssign = function () {
						for (var e, s, i, r, a = arguments.length, n = new Array(a), o = 0; o < a; o++) {
							n[o] = arguments[o];
						}if (this.match(h.jsxTagStart)) {
							st(this.curContext() === E.j_oTag), st(this.state.context[this.state.context.length - 2] === E.j_expr);var p = this.state.clone();try {
								var c;return (c = t.prototype.parseMaybeAssign).call.apply(c, [this].concat(n));
							} catch (t) {
								if (!(t instanceof SyntaxError)) throw t;this.state = p, st(this.curContext() === E.j_oTag), this.state.context.pop(), st(this.curContext() === E.j_expr), this.state.context.pop(), e = t;
							}
						}if (void 0 === e && !this.isRelational("<")) return (s = t.prototype.parseMaybeAssign).call.apply(s, [this].concat(n));var l = this.state.clone();try {
							var u;r = this.tsParseTypeParameters(), "ArrowFunctionExpression" !== (i = (u = t.prototype.parseMaybeAssign).call.apply(u, [this].concat(n))).type && this.unexpected();
						} catch (s) {
							var d;if (!(s instanceof SyntaxError)) throw s;if (e) throw e;return st(!this.hasPlugin("jsx")), this.state = l, (d = t.prototype.parseMaybeAssign).call.apply(d, [this].concat(n));
						}return r && 0 !== r.params.length && this.resetStartLocationFromNode(i, r.params[0]), i.typeParameters = r, i;
					}, i.parseMaybeUnary = function (e) {
						return !this.hasPlugin("jsx") && this.eatRelational("<") ? this.tsParseTypeAssertion() : t.prototype.parseMaybeUnary.call(this, e);
					}, i.parseArrow = function (e) {
						if (this.match(h.colon)) {
							var s = this.state.clone();try {
								var i = this.tsParseTypeOrTypePredicateAnnotation(h.colon);this.canInsertSemicolon() && this.unexpected(), this.match(h.arrow) || this.unexpected(), e.returnType = i;
							} catch (t) {
								if (!(t instanceof SyntaxError)) throw t;this.state = s;
							}
						}return t.prototype.parseArrow.call(this, e);
					}, i.parseAssignableListItemTypes = function (t) {
						if (this.eat(h.question)) {
							if ("Identifier" !== t.type) throw this.raise(t.start, "A binding pattern parameter cannot be optional in an implementation signature.");t.optional = !0;
						}var e = this.tsTryParseTypeAnnotation();return e && (t.typeAnnotation = e), this.finishNode(t, t.type);
					}, i.toAssignable = function (e, s, i) {
						switch (e.type) {case "TSTypeCastExpression":
								return t.prototype.toAssignable.call(this, this.typeCastToParameter(e), s, i);case "TSParameterProperty":default:
								return t.prototype.toAssignable.call(this, e, s, i);}
					}, i.checkLVal = function (e, s, i, r) {
						switch (e.type) {case "TSTypeCastExpression":
								return;case "TSParameterProperty":
								return void this.checkLVal(e.parameter, s, i, "parameter property");default:
								return void t.prototype.checkLVal.call(this, e, s, i, r);}
					}, i.parseBindingAtom = function () {
						switch (this.state.type) {case h._this:
								return this.parseIdentifier(!0);default:
								return t.prototype.parseBindingAtom.call(this);}
					}, i.isClassMethod = function () {
						return this.isRelational("<") || t.prototype.isClassMethod.call(this);
					}, i.isClassProperty = function () {
						return this.match(h.colon) || t.prototype.isClassProperty.call(this);
					}, i.parseMaybeDefault = function () {
						for (var e, s = arguments.length, i = new Array(s), r = 0; r < s; r++) {
							i[r] = arguments[r];
						}var a = (e = t.prototype.parseMaybeDefault).call.apply(e, [this].concat(i));return "AssignmentPattern" === a.type && a.typeAnnotation && a.right.start < a.typeAnnotation.start && this.raise(a.typeAnnotation.start, "Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`"), a;
					}, i.readToken = function (e) {
						return !this.state.inType || 62 !== e && 60 !== e ? t.prototype.readToken.call(this, e) : this.finishOp(h.relational, 1);
					}, i.toAssignableList = function (e, s, i) {
						for (var r = 0; r < e.length; r++) {
							var a = e[r];a && "TSTypeCastExpression" === a.type && (e[r] = this.typeCastToParameter(a));
						}return t.prototype.toAssignableList.call(this, e, s, i);
					}, i.typeCastToParameter = function (t) {
						return t.expression.typeAnnotation = t.typeAnnotation, this.finishNodeAt(t.expression, t.expression.type, t.typeAnnotation.end, t.typeAnnotation.loc.end);
					}, i.toReferencedList = function (t) {
						for (var e = 0; e < t.length; e++) {
							var s = t[e];s && s._exprListItem && "TsTypeCastExpression" === s.type && this.raise(s.start, "Did not expect a type annotation here.");
						}return t;
					}, i.shouldParseArrow = function () {
						return this.match(h.colon) || t.prototype.shouldParseArrow.call(this);
					}, i.shouldParseAsyncArrow = function () {
						return this.match(h.colon) || t.prototype.shouldParseAsyncArrow.call(this);
					}, e;
				}(t);
			};var rt = {};e.parse = function (t, e) {
				if (!e || "unambiguous" !== e.sourceType) return it(e, t).parse();e = Object.assign({}, e);try {
					e.sourceType = "module";var s = it(e, t).parse();return function (t) {
						return t.program.body.some(function (t) {
							return "ImportDeclaration" === t.type && (!t.importKind || "value" === t.importKind) || "ExportNamedDeclaration" === t.type && (!t.exportKind || "value" === t.exportKind) || "ExportAllDeclaration" === t.type && (!t.exportKind || "value" === t.exportKind) || "ExportDefaultDeclaration" === t.type;
						});
					}(s) || (s.program.sourceType = "script"), s;
				} catch (s) {
					try {
						return e.sourceType = "script", it(e, t).parse();
					} catch (t) {}throw s;
				}
			}, e.parseExpression = function (t, e) {
				var s = it(e, t);return s.options.strictMode && (s.state.strict = !0), s.getExpression();
			}, e.tokTypes = h;
		});function parse(t, e, s) {
			var i = lib,
			    r = { sourceType: "module", allowImportExportEverywhere: !0, allowReturnOutsideFunction: !0, plugins: ["jsx", "flow", "doExpressions", "objectRestSpread", "decorators", "classProperties", "exportDefaultFrom", "exportNamespaceFrom", "asyncGenerators", "functionBind", "functionSent", "dynamicImport", "numericSeparator", "importMeta", "optionalCatchBinding", "optionalChaining", "classPrivateProperties", "pipelineOperator", "nullishCoalescingOperator"] },
			    a = s && "json" === s.parser ? "parseExpression" : "parse";var n = void 0;try {
				n = i[a](t, r);
			} catch (e) {
				try {
					n = i[a](t, Object.assign({}, r, { strictMode: !1 }));
				} catch (t) {
					throw parserCreateError(e.message.replace(/ \(.*\)/, ""), { start: { line: e.loc.line, column: e.loc.column + 1 } });
				}
			}return delete n.tokens, n;
		}unwrapExports$$1(lib);var parserBabylon = parse;module.exports = parserBabylon;
	});

	var parserBabylon = unwrapExports(parserBabylon_1);

	return parserBabylon;
}();
