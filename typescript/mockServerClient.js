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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var index_1 = require("../index");
var mockServerClient_1 = require("../mockServerClient");
var client = index_1.mockServerClient('mockhttp', 1080);
var expectation = {
    httpRequest: {
        method: 'POST',
        path: "/some/path",
        body: {
            type: 'REGEX',
            regex: '.*'
        }
    },
    httpResponse: {
        statusCode: 200,
        body: {
            body: {},
            headers: {},
            statusCode: 200
        }
    },
    times: {
        unlimited: true
    }
};
var expectations = [expectation, expectation];
var matcher = {
    method: 'POST',
    path: 'some/path',
    body: {
        type: 'REGEX',
        regex: ".*"
    },
};
function test() {
    return __awaiter(this, void 0, void 0, function () {
        var requestResponse, _this, string;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, client.mockAnyResponse(expectation)];
                case 1:
                    requestResponse = _a.sent();
                    return [4, client.mockAnyResponse(expectations)];
                case 2:
                    _a.sent();
                    return [4, client.mockWithCallback(matcher, function (request) { return 5; })];
                case 3:
                    requestResponse = _a.sent();
                    return [4, client.mockWithCallback(matcher, function (request) { return 5; }, 10)];
                case 4:
                    requestResponse = _a.sent();
                    return [4, client.mockSimpleResponse('some/path', {})];
                case 5:
                    requestResponse = _a.sent();
                    return [4, client.mockSimpleResponse('some/path', {}, 500)];
                case 6:
                    requestResponse = _a.sent();
                    _this = client.setDefaultHeaders([
                        { "name": "Content-Type", "values": ["application/json; charset=utf-8"] },
                        { "name": "Cache-Control", "values": ["no-cache, no-store"] }
                    ], [
                        { "name": "sessionId", "values": ["786fcf9b-606e-605f-181d-c245b55e5eac"] }
                    ]);
                    _this = client.setDefaultHeaders({
                        "Content-Type": ["application/json; charset=utf-8"]
                    }, {
                        "sessionId": ["786fcf9b-606e-605f-181d-c245b55e5eac"]
                    });
                    return [4, client.verify(matcher)];
                case 7:
                    string = _a.sent();
                    return [4, client.verify(matcher, 1)];
                case 8:
                    _a.sent();
                    return [4, client.verify(matcher, 1, 2)];
                case 9:
                    _a.sent();
                    return [4, client.verifySequence([matcher, matcher])];
                case 10:
                    string = _a.sent();
                    return [4, client.reset()];
                case 11:
                    requestResponse = _a.sent();
                    return [4, client.clear('some/path', mockServerClient_1.ClearType.EXPECTATIONS)];
                case 12:
                    requestResponse = _a.sent();
                    return [4, client.bind([1, 2, 3, 4])];
                case 13:
                    requestResponse = _a.sent();
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=mockServerClient.js.map