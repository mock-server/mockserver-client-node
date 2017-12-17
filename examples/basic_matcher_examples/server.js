function matchRequestByPath() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some/path"
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByPathExactlyTwice() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some/path"
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 2,
            "unlimited": false
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByPathExactlyOnceInTheNext60Seconds() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some/path"
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 1,
            "unlimited": false
        },
        "timeToLive": {
            "timeUnit": "SECONDS",
            "timeToLive": 60,
            "unlimited": false
        }
    });
}

function matchRequestByRegexPath() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    // matches any requests those path starts with "/some"
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some.*"
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByNotMatchingPath() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    // matches any requests those path does NOT start with "/some"
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "!/some.*"
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByNotMatchingMethod() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    // matches any requests that does NOT have a "GET" method
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "method": "!GET"
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByHeaders() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "method": "GET",
            "path": "/some/path",
            "headers": {
                "Accept": ["application/json"],
                "Accept-Encoding": ["gzip, deflate, br"]
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByNotMatchingHeaderValue() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some/path",
            "headers": {
                // matches requests that have an Accept header without the value "application/json"
                "Accept": ["!application/json"],
                // matches requests that have an Accept-Encoding without the substring "gzip"
                "Accept-Encoding": ["!.*gzip.*"]
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByNotMatchingHeaders() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some/path",
            "headers": {
                // matches requests that do not have either an Accept or an Accept-Encoding header
                "!Accept": [".*"],
                "!Accept-Encoding": [".*"]
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByCookiesAndQueryParameters() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "method": "GET",
            "path": "/view/cart",
            "queryStringParameters": {
                "cartId": ["055CA455-1DF7-45BB-8535-4F83E7266092"]
            },
            "cookies": {
                "session": "4930456C-C718-476F-971F-CB8E047AB349"
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByRegexBody() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "body": "starts_with_.*"
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByBodyInUTF16() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "body": {
                "type": "STRING",
                "string": "我说中国话",
                "contentType": "text/plain; charset=utf-16"
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByBodyWithFormSubmission() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "method": "POST",
            "headers": {
                "Content-Type": ["application/x-www-form-urlencoded"]
            },
            "body": {
                "type": "PARAMETERS",
                "parameters": {
                    "email": ["joe.blogs@gmail.com"],
                    "password": ["secure_Password123"]
                }
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByBodyWithXPath() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "body": {
                // matches any request with an XML body containing
                // an element that matches the XPath expression
                "type": "XPATH",
                "xpath": "/bookstore/book[price>30]/price"
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
    // matches a request with the following body:
    /*
    <?xml version="1.0" encoding="ISO-8859-1"?>
    <bookstore>
      <book category="COOKING">
        <title lang="en">Everyday Italian</title>
        <author>Giada De Laurentiis</author>
        <year>2005</year>
        <price>30.00</price>
      </book>
      <book category="CHILDREN">
        <title lang="en">Harry Potter</title>
        <author>J K. Rowling</author>
        <year>2005</year>
        <price>29.99</price>
      </book>
      <book category="WEB">
        <title lang="en">Learning XML</title>
        <author>Erik T. Ray</author>
        <year>2003</year>
        <price>31.95</price>
      </book>
    </bookstore>
     */
}

function matchRequestByNotMatchingBodyWithXPath() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "body": {
                // matches any request with an XML body that does NOT
                // contain an element that matches the XPath expression
                "not": true,
                "type": "XPATH",
                "xpath": "/bookstore/book[price>30]/price"
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByBodyWithXml() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "body": {
                "type": "XML",
                "xml": "<bookstore>\n" +
                "   <book nationality=\"ITALIAN\" category=\"COOKING\">\n" +
                "       <title lang=\"en\">Everyday Italian</title>\n" +
                "       <author>Giada De Laurentiis</author>\n" +
                "       <year>2005</year>\n" +
                "       <price>30.00</price>\n" +
                "   </book>\n" +
                "</bookstore>"
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByBodyWithXmlSchema() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "body": {
                "type": "XML_SCHEMA",
                "xmlSchema": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n" +
                "    <!-- XML Schema Generated from XML Document on Wed Jun 28 2017 21:52:45 GMT+0100 (BST) -->\n" +
                "    <!-- with XmlGrid.net Free Online Service http://xmlgrid.net -->\n" +
                "    <xs:element name=\"notes\">\n" +
                "        <xs:complexType>\n" +
                "            <xs:sequence>\n" +
                "                <xs:element name=\"note\" maxOccurs=\"unbounded\">\n" +
                "                    <xs:complexType>\n" +
                "                        <xs:sequence>\n" +
                "                            <xs:element name=\"to\" minOccurs=\"1\" maxOccurs=\"1\" type=\"xs:string\"></xs:element>\n" +
                "                            <xs:element name=\"from\" minOccurs=\"1\" maxOccurs=\"1\" type=\"xs:string\"></xs:element>\n" +
                "                            <xs:element name=\"heading\" minOccurs=\"1\" maxOccurs=\"1\" type=\"xs:string\"></xs:element>\n" +
                "                            <xs:element name=\"body\" minOccurs=\"1\" maxOccurs=\"1\" type=\"xs:string\"></xs:element>\n" +
                "                        </xs:sequence>\n" +
                "                    </xs:complexType>\n" +
                "                </xs:element>\n" +
                "            </xs:sequence>\n" +
                "        </xs:complexType>\n" +
                "    </xs:element>\n</xs:schema>"
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByBodyWithJsonExactly() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "body": {
                "type": "JSON",
                "json": JSON.stringify({
                    "id": 1,
                    "name": "A green door",
                    "price": 12.50,
                    "tags": ["home", "green"]
                }),
                "matchType": "STRICT"
            }
        },
        "httpResponse": {
            "statusCode": 202,
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByBodyWithJsonIgnoringExtraFields() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "body": {
                "type": "JSON",
                "json": JSON.stringify({
                    "id": 1,
                    "name": "A green door",
                    "price": 12.50,
                    "tags": ["home", "green"]
                })
            }
        },
        "httpResponse": {
            "statusCode": 202,
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}

function matchRequestByBodyWithJsonSchema() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "body": {
                "type": "JSON_SCHEMA",
                "jsonSchema": JSON.stringify({
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "title": "Product",
                    "description": "A product from Acme's catalog",
                    "type": "object",
                    "properties": {
                        "id": {
                            "description": "The unique identifier for a product",
                            "type": "integer"
                        },
                        "name": {
                            "description": "Name of the product",
                            "type": "string"
                        },
                        "price": {
                            "type": "number",
                            "minimum": 0,
                            "exclusiveMinimum": true
                        },
                        "tags": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "minItems": 1,
                            "uniqueItems": true
                        }
                    },
                    "required": ["id", "name", "price"]
                })
            }
        },
        "httpResponse": {
            "body": "some_response_body"
        },
        "times": {
            "remainingTimes": 0,
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    });
}