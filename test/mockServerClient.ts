import {mockServerClient} from '../index';
import {MockServerClient, RequestResponse} from '../mockServerClient';
import {Expectation, HttpResponse, RequestDefinition} from '../mockServer';

const client: MockServerClient = mockServerClient('mockhttp', 1080);

const response: HttpResponse = {
    statusCode: 200,
    body: {
        body: {},
        headers: {},
        statusCode: 200
    }
}

const expectation: Expectation = {
    httpRequest: {
        method: 'POST',
        path: `/some/path`,
        body: {
            type: 'REGEX',
            regex: '.*'
        }
    },
    httpResponse: response,
    times: {
        unlimited: true
    },
    timeToLive: {
        timeUnit: "HOURS",
        timeToLive: 1
    }
};

const expectations: Expectation[] = [expectation, expectation];

const matcher: RequestDefinition = {
    method: 'POST',
    path: 'some/path',
    body: {
        type: 'REGEX',
        regex: `.*`
    },
};

async function test() {
    let requestResponse: RequestResponse = await client.mockAnyResponse(expectation);
    await client.mockAnyResponse(expectations);

    requestResponse = await client.mockWithCallback(matcher, (request) => response);
    requestResponse = await client.mockWithCallback(matcher, (request) => response, 10);
    requestResponse = await client.mockWithCallback(matcher, (request) => response, 10, 10, {unlimited: true}, "some_id");

    requestResponse = await client.mockSimpleResponse('some/path', {});
    requestResponse = await client.mockSimpleResponse('some/path', {}, 500);

    let _this = client.setDefaultHeaders(
        [
            {"name": "Content-Type", "values": ["application/json; charset=utf-8"]},
            {"name": "Cache-Control", "values": ["no-cache, no-store"]}
        ],
        [
            {"name": "sessionId", "values": ["786fcf9b-606e-605f-181d-c245b55e5eac"]}
        ]);
    _this = client.setDefaultHeaders({
            "Content-Type": ["application/json; charset=utf-8"]
        },
        {
            "sessionId": ["786fcf9b-606e-605f-181d-c245b55e5eac"]
        });

    let string = await client.verify(matcher);
    await client.verify(matcher, 1);
    await client.verify(matcher, 1, 2);

    string = await client.verifySequence([matcher, matcher]);

    requestResponse = await client.reset();

    requestResponse = await client.clear('some/path', 'ALL');
    requestResponse = await client.clear('some/path', 'LOG');
    requestResponse = await client.clear('some/path', 'EXPECTATIONS');

    requestResponse = await client.bind([1, 2, 3, 4]);
}
