# Skyagi-API
Skyagi-API is the web API endpoint of Skyagi, which would allow users to interact with Skyagi through web interface. With Skyagi-API, anyone can convinienlty build interactive application that incorporates the emerging human-like capability from LLM.

Skyagi-API is built on top of langchain-serve with websocket, and makes use of the Human-in-the-loop capability to provide an interactive API experience just like running the Skyagi application through python natively and locally. 

## Endpoint
`/runskyagi`
The endpoint to start a Skyagi session. 
### How to use the endpoint
To initialize the Skyagi session, a user needs to send the agent configurations in the json format.

Once the session is initiated, the endpoint will return the instructions of what user inputs are needed, and the web app can send the user inputs to the existing session through the established websocket and continue the Skyagi session.

More information about how to use the `/runskyagi` endpoint can be found through the example app.