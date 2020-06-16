/* tslint:disable */
export type ListOfExpectations = Expectation[];
export interface Expectation {
    id?: string;
    priority?: number;
    httpRequest?: RequestDefinition;
    httpResponse?: HttpResponse;
    httpResponseTemplate?: HttpTemplate;
    httpResponseClassCallback?: HttpClassCallback;
    httpResponseObjectCallback?: HttpObjectCallback;
    httpForward?: HttpForward;
    httpForwardTemplate?: HttpTemplate;
    httpForwardClassCallback?: HttpClassCallback;
    httpForwardObjectCallback?: HttpObjectCallback;
    httpOverrideForwardedRequest?: HttpOverrideForwardedRequest;
    httpError?: HttpError;
    times?: Times;
    timeToLive?: TimeToLive;
}
export type RequestDefinition =
    | HttpRequest
    | OpenAPIDefinition;
export interface HttpRequest {
    body?: BodyWithContentType;
    headers?: KeyToMultiValue;
    cookies?: KeyToValue;
    queryStringParameters?: KeyToMultiValue;
    path?: string;
    method?: string;
    secure?: boolean;
    keepAlive?: boolean;
    socketAddress?: SocketAddress;
}
export interface OpenAPIDefinition {
    specUrlOrPayload?: string;
    operationId?: string
}
export interface HttpResponse {
    delay?: Delay;
    body?: Body;
    cookies?: KeyToValue;
    connectionOptions?: ConnectionOptions;
    headers?: KeyToMultiValue;
    statusCode?: number;
    reasonPhrase?: string;
}
export interface HttpTemplate {
    delay?: Delay;
    templateType?: "JAVASCRIPT" | "VELOCITY";
    template?: string;
}
export interface HttpForward {
    delay?: Delay;
    host?: string;
    port?: number;
    scheme?: "HTTP" | "HTTPS";
}
export interface HttpClassCallback {
    delay?: Delay;
    callbackClass?: string;
}
export interface HttpObjectCallback {
    delay?: Delay;
    clientId?: string;
    responseCallback?: boolean;
}
export interface HttpOverrideForwardedRequest {
    delay?: Delay;
    httpRequest?: HttpRequest;
    httpResponse?: HttpResponse;
}
export interface HttpError {
    delay?: Delay;
    dropConnection?: boolean;
    responseBytes?: string;
}
export interface Times {
    remainingTimes?: number;
    unlimited?: boolean;
}
export interface TimeToLive {
    timeUnit?: "DAYS" | "HOURS" | "MINUTES" | "SECONDS" | "MILLISECONDS" | "MICROSECONDS" | "NANOSECONDS";
    timeToLive?: number;
    endDate?: number;
    unlimited?: boolean;
}
export type KeyToMultiValue =
    | {
    name?: string;
    values?: string[];
}[]
    | {
    /**
     * via the `patternProperty` "^\S+$".
     */
    [k: string]: string[];
};
export type KeyToValue =
    | {
    name?: string;
    value?: string;
}[]
    | {
    /**
     * via the `patternProperty` "^\S+$".
     */
    [k: string]: string;
};
export interface SocketAddress {
    host?: string;
    port?: number;
    scheme?: "HTTP" | "HTTPS";
}
export type Body =
    | {
    not?: boolean;
    type?: "BINARY";
    base64Bytes?: string;
    contentType?: string;
}
    | {
    not?: boolean;
    type?: "JSON";
    json?: string;
    contentType?: string;
}
    | {
    [k: string]: any;
}
    | any[]
    | {
    not?: boolean;
    type?: "PARAMETERS";
    parameters?: KeyToMultiValue;
}
    | {
    not?: boolean;
    type?: "STRING";
    string?: string;
    contentType?: string;
}
    | string
    | {
    not?: boolean;
    type?: "XML";
    xml?: string;
    contentType?: string;
};
export type BodyWithContentType =
    | {
    not?: boolean;
    type?: "BINARY";
    base64Bytes?: string;
    contentType?: string;
}
    | {
    not?: boolean;
    type?: "JSON";
    json?: string;
    contentType?: string;
    matchType?: "STRICT" | "ONLY_MATCHING_FIELDS";
}
    | {
    [k: string]: any;
}
    | any[]
    | {
    not?: boolean;
    type?: "JSON_SCHEMA";
    jsonSchema?: string;
}
    | {
    not?: boolean;
    type?: "JSON_PATH";
    jsonPath?: string;
}
    | {
    not?: boolean;
    type?: "PARAMETERS";
    parameters?: KeyToMultiValue;
}
    | {
    not?: boolean;
    type?: "REGEX";
    regex?: string;
}
    | {
    not?: boolean;
    type?: "STRING";
    string?: string;
    subString?: boolean;
    contentType?: string;
}
    | string
    | {
    not?: boolean;
    type?: "XML";
    xml?: string;
    contentType?: string;
}
    | {
    not?: boolean;
    type?: "XML_SCHEMA";
    xmlSchema?: string;
}
    | {
    not?: boolean;
    type?: "XPATH";
    xpath?: string;
};
export interface Delay {
    timeUnit?: string;
    value?: number;
}
export interface ConnectionOptions {
    suppressContentLengthHeader?: boolean;
    contentLengthHeaderOverride?: number;
    suppressConnectionHeader?: boolean;
    chunkSize?: number;
    keepAliveOverride?: boolean;
    closeSocket?: boolean;
    closeSocketDelay?: Delay;
}
export interface Verification {
    httpRequest?: RequestDefinition;
    times?: VerificationTimes;
}
export interface VerificationTimes {
    atLeast?: number;
    atMost?: number;
}
export interface VerificationSequence {
    httpRequests?: RequestDefinition[];
}
export interface Ports {
    ports?: number[];
}