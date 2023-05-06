# SkyAGI-API

SkyAGI-API is the web API endpoint of SkyAGI, which would allow users to interact with SkyAGI through web interface. With SkyAGI-API, anyone can convinienlty build interactive application that incorporates the emerging human-like capability from LLM.

SkyAGI-API is built on top of [langchain-serve](https://github.com/jina-ai/langchain-serve/tree/main) with websocket, and makes use of the [Human-in-the-loop](https://github.com/jina-ai/langchain-serve/tree/main/examples/websockets/hitl) capability to provide an interactive API experience just like running the SkyAGI application through python natively and locally.

## Endpoint

`/runskyagi`: the endpoint to start and run a SkyAGI session.

### How the enpoint works

To initialize the SkyAGI session, a user needs to send the agent configurations in the json format.

Once the session is initiated, the endpoint will return the instructions of what user inputs are needed, and the web app can send the user inputs to the existing session through the established websocket and continue the SkyAGI session.

More information about how to use the `/runskyagi` endpoint can be found through the example app.

### How to use the endpoint 

#### Use public cloud deployment (WIP)

#### Use local deployment for testing

SkyAGI-API supports a local deployment for testing. To run the endpoint locally, follow the steps blew:
* Install langchain-serve
```
pip install langchain-serve
```
* Deploy SkyAGI-API locally
```
git clone https://github.com/litanlitudan/skyagi.git
cd skyagi/skyagi-api
lc-serve deploy local skyagi-api
```
* Run the example client app
```
cd skyagi/skyagi-api/example
python skyagi-api-client.py
```

## TODO
- [X] Return the error message with termination
- [X] Stream output back to client
- [ ] Extend the client example to match the BigBangTheory from the example folder
- [ ] Deployment on Jina cloud: requires new SkyAGI python package release
- [ ] Implement API auth on Jina cloud