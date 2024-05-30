import React, { useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import { Box, Card } from '@mui/material';
import swal from 'sweetalert';

export default function Home({ cheatingLog, updateCheatingLog }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Function to run the COCO-SSD model
  const runCoco = async () => {
    const net = await cocossd.load();
    console.log('AI models loaded.');

    setInterval(() => {
      detect(net);
    }, 1500);
  };

  // Function to play audio and show SweetAlert
  const playAlertAndShowSwal = (title, text, icon, audioId) => {
    const alertSound = document.getElementById(audioId);
    alertSound.play().then(() => {
      swal(title, text, icon);
    }).catch((error) => {
      console.error('Error playing audio:', error);
      swal(title, text, icon); // Show swal even if audio fails to play
    });
  };

  // Function to detect objects and handle alerts
  const detect = async (net) => {
    if (
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const obj = await net.detect(video);

      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, videoWidth, videoHeight);

      let person_count = 0;
      if (obj.length < 1) {
        updateCheatingLog((prevLog) => ({
          ...prevLog,
          noFaceCount: prevLog.noFaceCount + 1,
        }));
        playAlertAndShowSwal('Face Not Visible', 'Action has been Recorded', 'error', 'faceNotVisibleSound');
      }

      obj.forEach((element) => {
        if (element.class === 'cell phone') {
          updateCheatingLog((prevLog) => ({
            ...prevLog,
            cellPhoneCount: prevLog.cellPhoneCount + 1,
          }));
          playAlertAndShowSwal('Cell Phone Detected', 'Action has been Recorded', 'error', 'cellPhoneDetectedSound');
        }
        if (element.class === 'book') {
          updateCheatingLog((prevLog) => ({
            ...prevLog,
            ProhibitedObjectCount: prevLog.ProhibitedObjectCount + 1,
          }));
          playAlertAndShowSwal('Prohibited Object Detected', 'Action has been Recorded', 'error', 'prohibitedObjectDetectedSound');
        }

        if (!element.class === 'person') {
          playAlertAndShowSwal('Face Not Visible', 'Action has been Recorded', 'error', 'faceNotVisibleSound');
        }
        if (element.class === 'person') {
          person_count++;
          if (person_count > 1) {
            updateCheatingLog((prevLog) => ({
              ...prevLog,
              multipleFaceCount: prevLog.multipleFaceCount + 1,
            }));
            playAlertAndShowSwal('Multiple Faces Detected', 'Action has been Recorded', 'error', 'multipleFacesDetectedSound');
            person_count = 0;
          }
        }
      });
    }
  };

  // Run COCO-SSD model when component mounts
  useEffect(() => {
    runCoco();
  }, []);

  return (
    <Box>
      <Card variant="outlined">
        <Webcam
          ref={webcamRef}
          muted={true}
          style={{
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 9,
            width: '100%',
            height: '100%',
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 8,
            width: 240,
            height: 240,
          }}
        />
      </Card>
      <audio id="faceNotVisibleSound" src="/face_not_visible.mp3" />
      <audio id="cellPhoneDetectedSound" src="/cell_phone_detected.mp3" />
      <audio id="prohibitedObjectDetectedSound" src="/prohibited_object_detected.mp3" />
      <audio id="multipleFacesDetectedSound" src="/multiple_faces_detected.mp3" />
    </Box>
  );
}
