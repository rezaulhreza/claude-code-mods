"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("claude-code/testing");
var describe_1 = require("../hooks/describe");
var SPINNER = {
    plugin: 'pulse',
    surface: 'terminal',
    component: 'Spinner',
    requestId: 'main',
    props: { word: 'Sauteing', message: null, suffix: '…', mode: 'tool-use' },
};
var TURN = {
    plugin: 'pulse',
    surface: 'terminal',
    component: 'TurnDuration',
    requestId: 'turn-1',
    props: { word: 'Baked', durationMs: 64000 },
};
(0, testing_1.test)('describe names the work in plain words', function () {
    var cwd = '/Users/dev/app';
    (0, testing_1.expect)((0, describe_1.describe)({ tool: 'Read', file_path: '/Users/dev/app/src/a.ts' }, cwd)).toBe('Reading src/a.ts');
    (0, testing_1.expect)((0, describe_1.describe)({ tool: 'Edit', file_path: '/Users/dev/other/b.ts' }, cwd)).toBe('Editing ~/other/b.ts');
    (0, testing_1.expect)((0, describe_1.describe)({ tool: 'Bash', command: 'npm   test\n&& echo' }, cwd)).toBe('Running npm test');
    (0, testing_1.expect)((0, describe_1.describe)({ tool: 'Agent', subagent_type: 'Explore', description: 'find callers' }, cwd)).toBe('Waiting on Explore: find callers');
    (0, testing_1.expect)((0, describe_1.describe)({ tool: 'mcp__github__create_pr' }, cwd)).toBe('Calling github create_pr');
});
(0, testing_1.test)('diffs count added and removed lines', function () {
    var edit = { filePath: '/a.ts', structuredPatch: [{ lines: [' x', '+y', '+z', '-w'] }] };
    (0, testing_1.expect)((0, describe_1.diffsOf)('Edit', edit)).toEqual([{ file: '/a.ts', added: 2, removed: 1 }]);
    (0, testing_1.expect)((0, describe_1.diffsOf)('Write', { type: 'create', filePath: '/b.ts', content: 'a\nb\n' })).toEqual([
        { file: '/b.ts', added: 2, removed: 0 },
    ]);
    (0, testing_1.expect)((0, describe_1.diffsOf)('Read', { file: {} })).toEqual([]);
});
(0, testing_1.test)('turn line and status line read cleanly', function () {
    var stat = { durationMs: 64200, tools: 9, files: 3, added: 48, removed: 12 };
    (0, testing_1.expect)((0, describe_1.turnLine)(64000, stat)).toBe('✓ Done in 1m 04s · 9 tools · 3 files changed · +48 −12');
    (0, testing_1.expect)((0, describe_1.turnLine)(8000, undefined)).toBe('✓ Done in 8s');
    (0, testing_1.expect)((0, describe_1.closest)([stat], 64000)).toBe(stat);
    (0, testing_1.expect)((0, describe_1.closest)([stat], 90000)).toBeUndefined();
    (0, testing_1.expect)((0, describe_1.statusLine)('claude-opus-5-5', {
        context: { percent: 81, tokens: 162000, window: 200000 },
        rateLimits: [{ kind: 'five_hour', percentUsed: 64.4 }, { kind: 'seven_day', percentUsed: 31 }],
        cost: { usd: 2.4 },
    })).toBe('opus-5.5 · context 162k/200k (81%), 38k left, compact soon · 5h limit 64% · week limit 31% · $2.40');
    (0, testing_1.expect)((0, describe_1.statusLine)('claude-opus-5-5', { context: { percent: 8 } })).toBe('opus-5.5 · context 8%');
    (0, testing_1.expect)([(0, describe_1.tokenCount)(950), (0, describe_1.tokenCount)(76400), (0, describe_1.tokenCount)(1000000), (0, describe_1.tokenCount)(1250000)]).toEqual(['950', '76k', '1M', '1.3M']);
    (0, testing_1.expect)((0, describe_1.statusLine)('claude-opus-5-5', {}, 'high')).toBe('opus-5.5 high');
});
(0, testing_1.test)('the spinner says what the running tool does', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var reached, isReached, release, gate, call, ui, _a;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                reached = function () { };
                isReached = new Promise(function (resolve) { return (reached = resolve); });
                release = function () { };
                gate = new Promise(function (resolve) { return (release = resolve); });
                on('session.start', function (_, e) { return ({ cwd: e.cwd }); });
                on('session.usage', function () { return ({ value: { startedAt: 0, context: { window: 200000 }, rateLimits: [] } }); });
                on('session.model', function () { return ({ value: 'claude-opus-5-5' }); });
                on('tool.call', function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                reached();
                                return [4 /*yield*/, gate];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, { result: {} }];
                        }
                    });
                }); });
                on('ui.render', function ($, e) {
                    var _a;
                    var Text = $.ui.resolve(e).Text;
                    var props = e.props;
                    return <Text>{(_a = props.message) !== null && _a !== void 0 ? _a : props.word}</Text>;
                });
                return [4 /*yield*/, $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })];
            case 1:
                _c.sent();
                call = $.tool.call({ tool: 'Bash', command: 'npm test' });
                return [4 /*yield*/, isReached];
            case 2:
                _c.sent();
                return [4 /*yield*/, $.ui.mount(SPINNER)];
            case 3:
                ui = _c.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Text' })];
            case 4:
                _a.apply(void 0, [(_b = (_c.sent())) === null || _b === void 0 ? void 0 : _b.text]).toBe('Running npm test');
                return [4 /*yield*/, ui.unmount()];
            case 5:
                _c.sent();
                release();
                return [4 /*yield*/, call];
            case 6:
                _c.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('a /clear resets the context on the status line', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var status;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                on('session.start', function (_, e) { return ({ cwd: e.cwd }); });
                on('session.end', function (_, e) { return ({ sessionId: e.sessionId }); });
                on('session.usage', function () { return ({
                    value: { startedAt: 0, context: { window: 200000, tokens: 150000, percent: 75 }, rateLimits: [] },
                }); });
                on('session.model', function () { return ({ value: 'claude-opus-5-5' }); });
                on('ui.status', function (_, e) {
                    status = e.text;
                });
                return [4 /*yield*/, $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })];
            case 1:
                _a.sent();
                (0, testing_1.expect)(status).toBe('opus-5.5 · context 150k/200k (75%), 50k left, compact soon');
                return [4 /*yield*/, $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })];
            case 2:
                _a.sent();
                (0, testing_1.expect)(status).toBe('opus-5.5 · context 0/200k (0%), 200k left');
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('an old turn line still reads as done, with its time', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var ui, _a;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                on('ui.render', function ($, e) {
                    var Text = $.ui.resolve(e).Text;
                    return <Text>engine</Text>;
                });
                return [4 /*yield*/, $.ui.mount(TURN)];
            case 1:
                ui = _c.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Text' })];
            case 2:
                _a.apply(void 0, [(_b = (_c.sent())) === null || _b === void 0 ? void 0 : _b.text]).toBe('✓ Done in 1m 04s');
                return [4 /*yield*/, ui.unmount()];
            case 3:
                _c.sent();
                return [2 /*return*/];
        }
    });
}); });
