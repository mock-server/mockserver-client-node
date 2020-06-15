// Type definitions for mockserver-client-node 5.10.0
// Promject: https://github.com/mock-server/mockserver-client-node
// Definitions by: David Tanner <https://github.com/DavidTanner>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.1

import {
    Expectation,
    RequestMatcher,
    NumberOfResponses,
    ResponseToReturn, KeyToMultiValue,
} from './mockServer';

export type Host = string;
export type Port = number;
export type ContextPath = string;
export type TLS = boolean;
export type CaCertPemFilePath = string;

export type ClearType = 'EXPECTATIONS' | 'LOG' | 'ALL';

export interface SuccessFullRequest {
    statusCode: number;
    body: string;
}

export type RequestResponse = SuccessFullRequest | string;

export type PathOrRequestMatcher = string | Expectation | RequestMatcher | undefined | null;

export interface MockServerClient {
    mockAnyResponse(expectation: Expectation | Expectation[]): Promise<RequestResponse>;

    mockWithCallback(requestMatcher: RequestMatcher, requestHandler: (request: any) => any, times?: NumberOfResponses | number): Promise<RequestResponse>;

    mockSimpleResponse<T = any>(path: string, responseBody: T, statusCode?: number): Promise<RequestResponse>;

    setDefaultHeaders(responseHeaders: KeyToMultiValue, requestHeaders: KeyToMultiValue): MockServerClient;

    verify(matcher: RequestMatcher, atLeast?: number, atMost?: number): Promise<void | string>;

    verifySequence(matchers: RequestMatcher[]): Promise<void | string>;

    reset(): Promise<RequestResponse>;

    clear(pathOrRequestMatcher: PathOrRequestMatcher, type: ClearType): Promise<RequestResponse>;

    bind(ports: Port[]): Promise<RequestResponse>;

    retrieveRecordedRequests(pathOrRequestMatcher: PathOrRequestMatcher): Promise<ResponseToReturn[]>;

    retrieveRecordedRequestsAndResponses(pathOrRequestMatcher: PathOrRequestMatcher): Promise<Expectation[]>;

    retrieveActiveExpectations(pathOrRequestMatcher: PathOrRequestMatcher): Promise<Expectation[]>;

    retrieveRecordedExpectations(pathOrRequestMatcher: PathOrRequestMatcher): Promise<Expectation[]>;

    retrieveLogMessages(pathOrRequestMatcher: PathOrRequestMatcher): Promise<string[]>;

}

/**
 * Start the client communicating at the specified host and port
 * for example:
 *
 *   var client = mockServerClient("localhost", 1080);
 *
 * @param host {string} the host for the server to communicate with
 * @param port {number} the port for the server to communicate with
 * @param contextPath {string} the context path if server was deployed as a war
 * @param tls {boolean} enable TLS (i.e. HTTPS) for communication to server
 * @param caCertPemFilePath {string} provide custom CA Certificate (defaults to MockServer CA Certificate)
 */
export declare function mockServerClient (
    host: Host,
    port: Port,
    contextPath?: ContextPath,
    tls?: TLS,
    caCertPemFilePath?: CaCertPemFilePath
): MockServerClient;

