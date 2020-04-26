
![LiVE](app-res-logo-black.svg)

Live Video Experience (LiVE)
============================

This is the **LiVE Receiver**, the trainee client-side desktop application
(for Windows and macOS) for receiving a live video stream of a training
via a [LiVE Relay](https://github.com/rse/live-relay) service from a
trainer running the [LiVE Sender](https://github.com/rse/live-sender) side.

Live Video Experience (LiVE) is a setup consisting of three components:

- [LiVE Sender](https://github.com/rse/live-sender):
  This component is run at the trainer-side of a LiVE session,
  sends the live video-stream via RTMPS to the LiVE Relay
  and receives the live event-stream via MQTTS from the LiVE Relay.

- [LiVE Relay](https://github.com/rse/live-relay)
  This component is run at the server-side of a LiVE session
  and relays the RTMPS video-stream and MQTTS event-stream betweeen the trainer
  and the trainees.

- [LiVE Receiver](https://github.com/rse/live-receiver)
  This component is run at the trainee-side of a LiVE session,
  receives the live video-stream via RTMPS from the LiVE Relay
  and sends the live event-stream via MQTTS to the LiVE Relay.

