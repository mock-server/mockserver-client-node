/*
 * mockserver
 * http://mock-server.com
 *
 * Copyright (c) 2014 James Bloom
 * Licensed under the Apache License, Version 2.0
 */

export interface OpenAPIExpectation {
    specUrlOrPayload: string;
    operationsAndResponses?: {
        [k: string]: string;
    }
}

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
    secure?: boolean;
    keepAlive?: boolean;
    method?: string;
    path?: string;
    pathParameters?: KeyToMultiValue;
    queryStringParameters?: KeyToMultiValue;
    body?: Body;
    headers?: KeyToMultiValue;
    cookies?: KeyToValue;
    socketAddress?: SocketAddress;
}

export interface OpenAPIDefinition {
    specUrlOrPayload?:
        string
        | object;
    operationId?: string
}

export interface HttpResponse {
    delay?: Delay;
    body?: BodyWithContentType;
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
    // TODO keyMatchStyle?: "MATCHING_KEY" | "SUB_SET";
    /**
     * via the `patternProperty` "^\S+$".
     */
    [k: string]:
        StringOrJsonSchema[]
        | {
        parameterStyle?: "SIMPLE"
            | "SIMPLE_EXPLODED"
            | "LABEL"
            | "LABEL_EXPLODED"
            | "MATRIX"
            | "MATRIX_EXPLODED"
            | "FORM_EXPLODED"
            | "FORM"
            | "SPACE_DELIMITED_EXPLODED"
            | "SPACE_DELIMITED"
            | "PIPE_DELIMITED_EXPLODED"
            | "PIPE_DELIMITED"
            | "DEEP_OBJECT";
        values: StringOrJsonSchema[]
    };
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
    [k: string]: StringOrJsonSchema;
};

export type StringOrJsonSchema =
    string
    | {
    not?: boolean;
    optional?: number;
    value?: string;
    schema?: object;
    parameterStyle?: "SIMPLE"
        | "SIMPLE_EXPLODED"
        | "LABEL"
        | "LABEL_EXPLODED"
        | "MATRIX"
        | "MATRIX_EXPLODED"
        | "FORM_EXPLODED"
        | "FORM"
        | "SPACE_DELIMITED_EXPLODED"
        | "SPACE_DELIMITED"
        | "PIPE_DELIMITED_EXPLODED"
        | "PIPE_DELIMITED"
        | "DEEP_OBJECT";
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
