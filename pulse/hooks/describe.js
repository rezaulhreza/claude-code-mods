"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relative = relative;
exports.clip = clip;
exports.describe = describe;
exports.target = target;
exports.noteOf = noteOf;
exports.diffsOf = diffsOf;
exports.duration = duration;
exports.turnLine = turnLine;
exports.closest = closest;
exports.modelLabel = modelLabel;
exports.tokenCount = tokenCount;
exports.statusLine = statusLine;
var HOME = /^\/(Users|home)\/[^/]+/;
function relative(path, cwd) {
    if (cwd && path.startsWith(cwd + '/')) {
        return path.slice(cwd.length + 1);
    }
    return path.replace(HOME, '~');
}
function clip(text, max) {
    var line = text.split('\n')[0].replace(/\s+/g, ' ').trim();
    return line.length > max ? line.slice(0, max - 1) + '…' : line;
}
function str(input, key) {
    var value = input[key];
    return typeof value === 'string' ? value : '';
}
// What the main loop is doing, as one short present-tense phrase.
function describe(input, cwd) {
    var file = relative(str(input, 'file_path') || str(input, 'notebook_path'), cwd);
    switch (input.tool) {
        case 'Read':
            return "Reading ".concat(file);
        case 'Edit':
        case 'MultiEdit':
        case 'NotebookEdit':
            return "Editing ".concat(file);
        case 'Write':
            return "Writing ".concat(file);
        case 'Bash':
            return "Running ".concat(clip(str(input, 'command'), 60));
        case 'WebFetch':
            return "Fetching ".concat(clip(str(input, 'url').replace(/^https?:\/\//, ''), 50));
        case 'WebSearch':
            return "Searching the web for \"".concat(clip(str(input, 'query'), 40), "\"");
        case 'Agent': {
            var type = str(input, 'subagent_type') || 'agent';
            return "Waiting on ".concat(type, ": ").concat(clip(str(input, 'description'), 40));
        }
        case 'Skill':
            return "Using skill ".concat(str(input, 'skill'));
        case 'TodoWrite':
        case 'TaskCreate':
        case 'TaskUpdate':
            return 'Updating tasks';
    }
    var mcp = /^mcp__(.+?)__(.+)$/.exec(input.tool);
    if (mcp) {
        return "Calling ".concat(mcp[1], " ").concat(mcp[2]);
    }
    return "Using ".concat(input.tool);
}
// The tool's short verb and what it acts on, for a ledger-style row.
function target(input, cwd) {
    var file = relative(str(input, 'file_path') || str(input, 'notebook_path'), cwd);
    switch (input.tool) {
        case 'Read':
        case 'Write':
            return { verb: input.tool, what: file };
        case 'Edit':
        case 'MultiEdit':
        case 'NotebookEdit':
            return { verb: 'Edit', what: file };
        case 'Bash':
            return { verb: 'Bash', what: clip(str(input, 'command'), 200) };
        case 'WebFetch':
            return { verb: 'Fetch', what: clip(str(input, 'url').replace(/^https?:\/\//, ''), 200) };
        case 'WebSearch':
            return { verb: 'Search', what: "\"".concat(clip(str(input, 'query'), 200), "\" on the web") };
        case 'Agent':
            return { verb: 'Agent', what: "".concat(str(input, 'subagent_type') || 'agent', " \u00B7 ").concat(clip(str(input, 'description'), 200)) };
        case 'Skill':
            return { verb: 'Skill', what: str(input, 'skill') };
    }
    var mcp = /^mcp__(.+?)__(.+)$/.exec(input.tool);
    if (mcp) {
        return { verb: mcp[1], what: mcp[2] };
    }
    var first = Object.entries(input).find(function (_a) {
        var key = _a[0], value = _a[1];
        return key !== 'tool' && typeof value === 'string';
    });
    return { verb: input.tool, what: first ? clip(String(first[1]), 200) : '' };
}
// One plain summary of a finished call: lines read, diff size, the first error line.
function noteOf(tool, ran) {
    var _a, _b;
    if (ran.deny !== undefined) {
        return clip("refused: ".concat(ran.deny), 80);
    }
    if (ran.isError) {
        var lines = ((_a = ran.text) !== null && _a !== void 0 ? _a : '').split('\n').map(function (one) { return one.trim(); });
        var code = lines.map(function (one) { return /^(?:error: )?exit code (\d+)/i.exec(one); }).find(Boolean);
        var first = lines.find(function (one) { return one && !/^(?:error: )?exit code \d+/i.test(one); });
        var parts = [code ? "exit ".concat(code[1]) : '', first !== null && first !== void 0 ? first : (code ? '' : 'failed')].filter(Boolean);
        return clip(parts.join(' · '), 80);
    }
    var r = ((_b = ran.result) !== null && _b !== void 0 ? _b : {});
    if (tool === 'Read') {
        var file = r.file;
        return typeof (file === null || file === void 0 ? void 0 : file.numLines) === 'number' ? "".concat(file.numLines, " lines") : '';
    }
    var diffs = diffsOf(tool, ran.result);
    if (tool === 'Write' && r.type === 'create' && diffs[0]) {
        return "new \u00B7 ".concat(diffs[0].added, " lines");
    }
    if (diffs.length) {
        var added = diffs.reduce(function (sum, d) { return sum + d.added; }, 0);
        var removed = diffs.reduce(function (sum, d) { return sum + d.removed; }, 0);
        return removed ? "+".concat(added, " \u2212").concat(removed) : "+".concat(added);
    }
    return '';
}
function count(file, hunks) {
    var added = 0;
    var removed = 0;
    for (var _i = 0, hunks_1 = hunks; _i < hunks_1.length; _i++) {
        var hunk = hunks_1[_i];
        for (var _a = 0, _b = hunk.lines; _a < _b.length; _a++) {
            var line = _b[_a];
            if (line.startsWith('+'))
                added += 1;
            else if (line.startsWith('-'))
                removed += 1;
        }
    }
    return { file: file, added: added, removed: removed };
}
// The files a finished call changed, with line counts, from the tool's own result.
function diffsOf(tool, result) {
    var _a, _b;
    if (!result || typeof result !== 'object') {
        return [];
    }
    var r = result;
    if ((tool === 'Edit' || tool === 'Write') && typeof r.filePath === 'string') {
        if (tool === 'Write' && r.type === 'create' && typeof r.content === 'string') {
            return [{ file: r.filePath, added: r.content.replace(/\n$/, '').split('\n').length, removed: 0 }];
        }
        return [count(r.filePath, (_a = r.structuredPatch) !== null && _a !== void 0 ? _a : [])];
    }
    if (tool === 'Bash' && r.bashEditDiff && typeof r.bashEditDiff === 'object') {
        var files = (_b = r.bashEditDiff.files) !== null && _b !== void 0 ? _b : [];
        return files.map(function (one) { return count(one.filePath, one.hunks); });
    }
    return [];
}
function duration(ms) {
    var s = Math.round(ms / 1000);
    if (s < 60)
        return "".concat(s, "s");
    if (s < 3600)
        return "".concat(Math.floor(s / 60), "m ").concat(String(s % 60).padStart(2, '0'), "s");
    return "".concat(Math.floor(s / 3600), "h ").concat(String(Math.floor((s % 3600) / 60)).padStart(2, '0'), "m");
}
var plural = function (n, one) { return "".concat(n, " ").concat(one).concat(n === 1 ? '' : 's'); };
function turnLine(durationMs, stat) {
    var parts = ["\u2713 Done in ".concat(duration(durationMs))];
    if (stat) {
        parts.push(stat.tools ? plural(stat.tools, 'tool') : 'no tools');
        if (stat.files)
            parts.push("".concat(plural(stat.files, 'file'), " changed"));
        if (stat.added || stat.removed)
            parts.push("+".concat(stat.added, " \u2212").concat(stat.removed));
    }
    return parts.join(' · ');
}
// The turn whose recorded length is nearest to the line's, within 1.5 s.
function closest(list, durationMs) {
    var best;
    var gap = 1500;
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
        var stat = list_1[_i];
        var d = Math.abs(stat.durationMs - durationMs);
        if (d <= gap) {
            best = stat;
            gap = d;
        }
    }
    return best;
}
function modelLabel(model) {
    var m = /^claude-([a-z]+)-(\d+)-(\d+)/.exec(model);
    return m ? "".concat(m[1], "-").concat(m[2], ".").concat(m[3]) : model.replace(/^claude-/, '');
}
// 950, 76k, 1M, 1.2M: token counts the way the status line reads them.
function tokenCount(n) {
    if (n < 1000)
        return String(n);
    if (n < 1000000)
        return "".concat(Math.round(n / 1000), "k");
    return "".concat(Number((n / 1000000).toFixed(1)), "M");
}
function statusLine(model, usage, effort, warnAt) {
    var _a, _b, _c, _d;
    if (warnAt === void 0) { warnAt = 75; }
    var parts = [effort === undefined ? modelLabel(model) : "".concat(modelLabel(model), " ").concat(effort)];
    var pct = (_a = usage.context) === null || _a === void 0 ? void 0 : _a.percent;
    var tokens = (_b = usage.context) === null || _b === void 0 ? void 0 : _b.tokens;
    var window = (_c = usage.context) === null || _c === void 0 ? void 0 : _c.window;
    if (pct !== undefined) {
        var fill = tokens !== undefined && window ? "context ".concat(tokenCount(tokens), "/").concat(tokenCount(window), " (").concat(pct, "%), ").concat(tokenCount(Math.max(0, window - tokens)), " left") : "context ".concat(pct, "%");
        parts.push(pct >= warnAt ? "".concat(fill, ", compact soon") : fill);
    }
    for (var _i = 0, _e = (_d = usage.rateLimits) !== null && _d !== void 0 ? _d : []; _i < _e.length; _i++) {
        var limit = _e[_i];
        if (limit.kind === 'five_hour')
            parts.push("5h limit ".concat(Math.round(limit.percentUsed), "%"));
        if (limit.kind === 'seven_day')
            parts.push("week limit ".concat(Math.round(limit.percentUsed), "%"));
    }
    if (usage.cost) {
        parts.push("$".concat(usage.cost.usd.toFixed(2)));
    }
    return parts.join(' · ');
}
