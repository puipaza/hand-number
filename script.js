const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const fingerCountLabel = document.getElementById('finger-count');

function onResults(results) {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  let totalFingers = 0;

  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i].label; // ตรวจว่าเป็นมือซ้ายหรือขวา
      
      let count = 0;

      // 1. นับนิ้วชี้, กลาง, นาง, ก้อย (ใช้ความสูง)
      const fingerTips = [8, 12, 16, 20];
      fingerTips.forEach(tip => {
        if (landmarks[tip].y < landmarks[tip - 2].y) {
          count++;
        }
      });

      // 2. นับนิ้วโป้ง (Thumb) - แยกตรรกะซ้าย/ขวา เพราะนิ้วโป้งกางคนละด้าน
      // เนื่องจากเรา Mirror กล้อง (scaleX -1) ค่า Left/Right จะสลับกันเล็กน้อย
      const thumbTip = landmarks[4];
      const thumbBase = landmarks[2];

      if (handedness === 'Left') {
        // มือซ้าย (ในจอ) นิ้วโป้งกางออกทางขวา (ค่า x มากขึ้น)
        if (thumbTip.x > thumbBase.x + 0.02) count++;
      } else {
        // มือขวา (ในจอ) นิ้วโป้งกางออกทางซ้าย (ค่า x น้อยลง)
        if (thumbTip.x < thumbBase.x - 0.02) count++;
      }

      totalFingers += count;

      // (ทางเลือก) วาดเส้นใยบางๆ เพื่อให้รู้ว่าตรวจเจอ แต่ไม่ให้เกะกะสายตา
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
    }
  }
  
  fingerCountLabel.innerText = totalFingers;
  canvasCtx.restore();
}
// ฟังก์ชันคำนวณระยะห่างระหว่าง 2 จุด
function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function onResults(results) {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  let totalFingers = 0;

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      let count = 0;

      // 1. นิ้วชี้ถึงนิ้วก้อย (8, 12, 16, 20)
      // เช็คว่าปลายนิ้วอยู่สูงกว่าข้อต่อที่สองหรือไม่
      const fingerTips = [8, 12, 16, 20];
      fingerTips.forEach(tip => {
        if (landmarks[tip].y < landmarks[tip - 2].y) count++;
      });

      // 2. นิ้วโป้ง (Thumb) - ใช้ระยะห่างแทนแกน X
      // วัดระยะจากปลายนิ้วโป้ง (4) ไปยังโคนนิ้วกลาง (9) 
      // ถ้าหันหลังมือหรือหน้ามือ ระยะกางจะยังคงมากกว่าระยะพับเสมอ
      const thumbTip = landmarks[4];
      const referencePoint = landmarks[9]; // ใช้โคนนิ้วกลางเป็นจุดอ้างอิง
      const distance = getDistance(thumbTip, referencePoint);

      // ถ้าห่างเกิน 0.15 (ค่าประมาณจากการกางนิ้ว) ให้นับเป็น 1
      if (distance > 0.15) {
        count++;
      }

      totalFingers += count;

      // วาดเส้นโครงกระดูกมือ (เพื่อให้เห็นว่า AI ยังจับมือเราอยู่)
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 3});
    }
  }
  
  fingerCountLabel.innerText = totalFingers;
  canvasCtx.restore();
}
function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function onResults(results) {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  let totalFingers = 0;

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      let count = 0;

      // 1. คำนวณ "ขนาดของฝ่ามือ" เพื่อใช้เป็นค่าอ้างอิง (Reference)
      // วัดจากข้อมือ (0) ไปยังโคนนิ้วกลาง (9)
      const palmSize = getDistance(landmarks[0], landmarks[9]);

      // 2. นิ้วชี้ถึงนิ้วก้อย (8, 12, 16, 20)
      const fingerTips = [8, 12, 16, 20];
      fingerTips.forEach(tip => {
        // ถ้าระยะปลายนิ้วถึงข้อมือ ยาวกว่าข้อต่อถัดลงมาถึงข้อมือ แปลว่าชูนิ้ว
        if (getDistance(landmarks[tip], landmarks[0]) > getDistance(landmarks[tip - 1], landmarks[0])) {
          count++;
        }
      });

      // 3. นิ้วโป้ง (Thumb) - ใช้สัดส่วนเทียบกับขนาดฝ่ามือ
      const thumbTip = landmarks[4];
      const thumbBase = landmarks[2];
      const pinkyBase = landmarks[17];
      
      // วัดระยะห่างปลายนิ้วโป้งกับโคนนิ้วก้อย
      const thumbDistance = getDistance(thumbTip, pinkyBase);
      
      // ถ้า thumbDistance มีค่ามากกว่า 0.9 ของขนาดฝ่ามือ แปลว่ากางนิ้ว
      // (อัตราส่วนนี้จะคงที่เสมอไม่ว่าจะใกล้หรือไกล)
      if (thumbDistance > palmSize * 0.9) {
        count++;
      }

      totalFingers += count;

      // วาดเส้นเชื่อมให้เห็นการทำงาน
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 3});
      
      // แถม: แสดงตัวเลขลอยตามมือ
      canvasCtx.font = "40px Arial";
      canvasCtx.fillStyle = "yellow";
      canvasCtx.fillText(count, landmarks[9].x * canvasElement.width, landmarks[9].y * canvasElement.height - 50);
    }
  }
  
  fingerCountLabel.innerText = totalFingers;
  canvasCtx.restore();
}
// ... ส่วนที่เหลือ (Hands config, Camera) ใช้ของเดิมได้เลยครับ ...
  canvasCtx.restore();

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 640,
  height: 480
});

// เริ่มทำงานพร้อมดักจับ Error
camera.start().catch(err => {
  statusLabel.innerText = "เกิดข้อผิดพลาด: " + err;
  console.error(err);
});