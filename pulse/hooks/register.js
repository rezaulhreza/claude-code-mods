"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
var claude_code_1 = require("claude-code");
var describe_1 = require("./describe");
var activity = (0, claude_code_1.atom)({ plugin: 'pulse', key: 'activity' }, []);
var turns = (0, claude_code_1.atom)({ plugin: 'pulse', key: 'turns' }, []);
var fresh = function () { return ({ tools: 0, files: new Map(), added: 0, removed: 0 }); };
function showStatus($, shown) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!shown.isOn) return [3 /*break*/, 3];
                    _b = (_a = $.ui).status;
                    _c = describe_1.statusLine;
                    _d = shown.model;
                    if (_d) return [3 /*break*/, 2];
                    return [4 /*yield*/, $.session.model()];
                case 1:
                    _d = (_e.sent());
                    _e.label = 2;
                case 2:
                    _b.apply(_a, [_c.apply(void 0, [_d, shown.usage, shown.effort, shown.warnAt])]);
                    _e.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
var register = function (on, options) {
    var _a;
    var cwd = '';
    var tally = fresh();
    var seq = 0;
    var shown = {
        model: '',
        usage: {},
        effort: undefined,
        isOn: options.statusLine !== false,
        warnAt: Number((_a = options.contextWarn) !== null && _a !== void 0 ? _a : 75),
    };
    on('session.start', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var started, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, next(e)];
                case 1:
                    started = _b.sent();
                    cwd = e.cwd;
                    _a = shown;
                    return [4 /*yield*/, $.session.usage()];
                case 2:
                    _a.usage = _b.sent();
                    return [4 /*yield*/, showStatus($, shown)];
                case 3:
                    _b.sent();
                    return [2 /*return*/, started];
            }
        });
    }); });
    // /clear fires no session.start, and the engine keeps reporting the last
    // response's fill until the next turn measures the new conversation.
    on('session.end', { reason: 'clear' }, function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var ended, usage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, next(e)];
                case 1:
                    ended = _a.sent();
                    return [4 /*yield*/, $.session.usage()];
                case 2:
                    usage = _a.sent();
                    shown.usage = __assign(__assign({}, usage), { context: { window: usage.context.window, tokens: 0, percent: 0 } });
                    return [4 /*yield*/, showStatus($, shown)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, ended];
            }
        });
    }); });
    on('session.measure', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var measured;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, next(e)];
                case 1:
                    measured = _a.sent();
                    shown.usage = e;
                    return [4 /*yield*/, showStatus($, shown)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, measured];
            }
        });
    }); });
    // Each main-loop request names the model and effort it runs at.
    on('turn.step', function ($, e, next) {
        return __asyncGenerator(this, arguments, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!e.agentId && (e.effort !== shown.effort || e.model !== shown.model))) return [3 /*break*/, 2];
                        shown.effort = e.effort;
                        shown.model = e.model;
                        return [4 /*yield*/, __await(showStatus($, shown))];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [5 /*yield**/, __values(__asyncDelegator(__asyncValues(next(e))))];
                    case 3: return [4 /*yield*/, __await.apply(void 0, [_a.sent()])];
                    case 4: return [4 /*yield*/, __await.apply(void 0, [_a.sent()])];
                    case 5: return [2 /*return*/, _a.sent()];
                }
            });
        });
    });
    on('turn.start', function ($, e, next) {
        if (!e.agentId) {
            tally = fresh();
        }
        return next(e);
    });
    on('tool.call', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var id, text, ran, _i, _a, diff;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (e.agentId) {
                        return [2 /*return*/, next(e)];
                    }
                    seq += 1;
                    id = (_b = e.tool_use_id) !== null && _b !== void 0 ? _b : "call-".concat(seq);
                    text = (0, describe_1.describe)(e, cwd);
                    return [4 /*yield*/, (0, claude_code_1.update)($, activity, function (list) { return __spreadArray(__spreadArray([], list, true), [{ id: id, text: text }], false); })];
                case 1:
                    _c.sent();
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, , 4, 6]);
                    return [4 /*yield*/, next(e)];
                case 3:
                    ran = _c.sent();
                    tally.tools += 1;
                    for (_i = 0, _a = (0, describe_1.diffsOf)(e.tool, ran.result); _i < _a.length; _i++) {
                        diff = _a[_i];
                        tally.files.set(diff.file, true);
                        tally.added += diff.added;
                        tally.removed += diff.removed;
                    }
                    return [2 /*return*/, ran];
                case 4: return [4 /*yield*/, (0, claude_code_1.update)($, activity, function (list) { return list.filter(function (one) { return one.id !== id; }); })];
                case 5:
                    _c.sent();
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }).catch(function ($, e, next) { return next(e); });
    on('turn.complete', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var done, stat_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, next(e)];
                case 1:
                    done = _a.sent();
                    if (!!e.agentId) return [3 /*break*/, 4];
                    stat_1 = {
                        durationMs: e.durationMs,
                        tools: tally.tools,
                        files: tally.files.size,
                        added: tally.added,
                        removed: tally.removed,
                    };
                    return [4 /*yield*/, (0, claude_code_1.update)($, turns, function (list) { return __spreadArray(__spreadArray([], list, true), [stat_1], false).slice(-200); })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, claude_code_1.update)($, activity, function () { return []; })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, done];
            }
        });
    }); });
    on('ui.render', { component: 'Spinner' }, function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var list, latest, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (options.spinner === false || e.surface !== 'terminal' || e.props.message !== null) {
                        return [2 /*return*/, next(e)];
                    }
                    return [4 /*yield*/, (0, claude_code_1.read)($, activity)];
                case 1:
                    list = _a.sent();
                    latest = list[list.length - 1];
                    if (e.props.mode === 'thinking') {
                        message = 'Thinking';
                    }
                    else if (e.props.mode === 'responding') {
                        message = 'Writing reply';
                    }
                    else if (e.props.mode === 'tool-use' && latest) {
                        message = list.length > 1 ? "".concat(latest.text, " (+").concat(list.length - 1, " more)") : latest.text;
                    }
                    return [2 /*return*/, message ? next(__assign(__assign({}, e), { props: __assign(__assign({}, e.props), { message: message }) })) : next(e)];
            }
        });
    }); });
    on('ui.render', { component: 'TurnDuration' }, function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var stat, _a, Text;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (options.turnLine === false || e.surface !== 'terminal' || e.props.isExpanded || e.props.waitingFor) {
                        return [2 /*return*/, next(e)];
                    }
                    _a = describe_1.closest;
                    return [4 /*yield*/, (0, claude_code_1.read)($, turns)];
                case 1:
                    stat = _a.apply(void 0, [_b.sent(), e.props.durationMs]);
                    Text = $.ui.resolve(e).Text;
                    return [2 /*return*/, <Text dimColor>{(0, describe_1.turnLine)(e.props.durationMs, stat)}</Text>];
            }
        });
    }); });
};
exports.register = register;
