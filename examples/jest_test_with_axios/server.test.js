import mockServerNode from 'mockserver-node';
import mockServerClient from 'mockserver-client';
import axios from 'axios';

beforeAll(async () => {
    await mockServerNode.start_mockserver({
        serverPort: 1080,
        trace: true,
        jvmOptions: '-Dmockserver.enableCORSForAllResponses=true'
    });
});

afterAll(async () => {
    await mockServerNode.stop_mockserver({
        serverPort: 1080
    });
});

test('actual service', async () => {
    // given
    const mockHttpServer = mockServerClient.mockServerClient;
    await mockHttpServer('127.0.0.1', 1080)
        .mockAnyResponse(
            {
                httpRequest: {
                    method: 'GET',
                    path: '/getMe',
                },
                httpResponse: {
                    statusCode: 200,
                    'body': JSON.stringify({foo: 'bar'}),
                    delay: {
                        timeUnit: 'MILLISECONDS',
                        value: 0
                    },
                },
                times: {
                    remainingTimes: 1,
                    unlimited: false
                }
            }
        )
        .then(
            (result) => {
                console.log('mock server training finished');
            },
            (error) => {
                console.log(`training the mock server went wrong: ` + error);
            }
        );

    // expect
    await axios.get('http://localhost:1080/getMe')
        .then((response) => {
            expect(response.status).toBe(200);
            expect(response.data.foo).toBe('bar')
        })
});

