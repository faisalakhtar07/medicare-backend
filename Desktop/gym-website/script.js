// Firebase Core & Auth CDN Libraries Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuuF-_xwZ5RUW_Q6GUmqeQTTiXpt9_IPc",
  authDomain: "the-big-house-gym.firebaseapp.com",
  projectId: "the-big-house-gym",
  storageBucket: "the-big-house-gym.firebasestorage.app",
  messagingSenderId: "1002363769150",
  appId: "1:1002363769150:web:70cbdce457b71dc3e65c6f"
};


// Firebase Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Setup Security Recaptcha on window load
window.onload = function () {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal', // इसे छुपाने के लिए आप 'invisible' भी कर सकते हैं
        'callback': (response) => {
            // reCAPTCHA solved
        }
    });
};

// Function to Send OTP to Mobile Number
window.sendOTP = function() {
    const nameInput = document.getElementById('name-input').value.trim();
    const phoneInput = document.getElementById('phone-input').value.trim();
    
    if (!nameInput) {
        alert("Please enter your name.");
        return;
    }
    if (phoneInput.length !== 10 || isNaN(phoneInput)) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
    }

    // ऑटोमैटिक भारत का कंट्री कोड (+91) जोड़ा गया है
    const phoneNumber = "+91" + phoneInput;
    const appVerifier = window.recaptchaVerifier;

    document.getElementById('send-otp-btn').innerText = "Sending...";
    document.getElementById('send-otp-btn').disabled = true;

    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
        .then((result) => {
            window.confirmationResult = result;
            alert("OTP Sent Successfully onto " + phoneNumber);
            
            // मोबाइल नंबर वाला बॉक्स छुपाएं और OTP बॉक्स दिखाएं
            document.getElementById('step-phone').classList.add('hidden');
            document.getElementById('step-otp').classList.remove('hidden');
            
            // नाम को कुछ देर के लिए सेव रखें
            localStorage.setItem('temp_name', nameInput);
        }).catch((error) => {
            alert("Error sending SMS: " + error.message);
            document.getElementById('send-otp-btn').innerText = "Send OTP";
            document.getElementById('send-otp-btn').disabled = false;
        });
}

// Function to Verify Received OTP
window.verifyOTP = function() {
    const otpInput = document.getElementById('otp-input').value.trim();
    
    if (otpInput.length !== 6 || isNaN(otpInput)) {
        alert("Please enter a valid 6-digit OTP.");
        return;
    }

    window.confirmationResult.confirm(otpInput)
        .then((result) => {
            const user = result.user;
            const finalName = localStorage.getItem('temp_name');
            
            // आपके मुख्य ऐप के लॉजिक के अनुसार डेटा LocalStorage में सेट कर दिया गया है
            localStorage.setItem('shg_user', user.phoneNumber);
            localStorage.setItem('shg_name', finalName);
            localStorage.removeItem('temp_name');

            alert("Login Successful!");
            
            // यहाँ अपने मुख्य Dashboard या जिम वाले दूसरे पेज का नाम लिखें जहाँ यूज़र को भेजना है:
            window.location.href = "dashboard.html"; 
            
        }).catch((error) => {
            alert("Invalid OTP. Please try again.");
        });
}



// ═══════════════════════════════════════════════
// CONSTANTS & DATABASE CORE ENGINE
// ═══════════════════════════════════════════════
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ROUTINES = {
  Monday: {
    label: 'PUSH DAY I', color: '#E8A020',
    exercises: [
      {id:'m1', name:'Incline DB Bench Press', sets:4, reps:10, muscle:'Upper Chest', tip:'Keep shoulders pinned back.', alts:['Incline Barbell Press', 'Hammer Strength Incline', 'Low Incline DB Fly']},
      {id:'m2', name:'Overhead Press (OHP)', sets:3, reps:8, muscle:'Shoulders', tip:'Core tight, no leaning back.', alts:['Seated DB Press', 'Smith Machine OHP', 'Machine Press']},
      {id:'m3', name:'Incline Cable Fly', sets:3, reps:12, muscle:'Chest', tip:'Squeeze at peak contraction.', alts:['High Cable Crossover','Low Incline Push-Up','Pec Deck']},
      {id:'m4', name:'Tricep Rope Pushdown', sets:3, reps:15, muscle:'Triceps', tip:'Elbows pinned to sides.', alts:['Overhead Tricep Extension','Close-Grip Bench','Dips']},
      {id:'m5', name:'Lateral Raises', sets:3, reps:15, muscle:'Side Delts', tip:'Slight forward lean.', alts:['Cable Lateral Raise','Upright Row','DB Y-Raise']}
    ]
  },
  Tuesday: {
    label: 'PULL DAY', color: '#3B82F6',
    exercises: [
      {id:'t1', name:'Pull-Ups', sets:4, reps:8, muscle:'Lats', tip:'Full dead hang at bottom.', alts:['Lat Pulldown','Assisted Pull-Up','Cable Pullover']},
      {id:'t2', name:'Barbell Row', sets:4, reps:10, muscle:'Upper Back', tip:'Pull to lower chest.', alts:['DB Bent-Over Row','Cable Row', 'T-Bar Row']},
      {id:'t3', name:'Face Pulls', sets:3, reps:15, muscle:'Rear Delts', tip:'Elbows high and flared.', alts:['Band Pull-Apart','Reverse Fly','Rear Delt Machine']},
      {id:'t4', name:'Hammer Curls', sets:3, reps:12, muscle:'Biceps', tip:'Neutral wrist; no swinging.', alts:['Barbell Curl','Preacher Curl','Cable Curl']},
      {id:'t5', name:'Seated Cable Row', sets:3, reps:12, muscle:'Mid Back', tip:'Pause and squeeze at top.', alts:['DB Row','Machine Row','Inverted Row']}
    ]
  },
  Wednesday: {
    label: 'LEG DAY', color: '#18C964',
    exercises: [
      {id:'w1', name:'Back Squat', sets:4, reps:8, muscle:'Quads/Glutes', tip:'Chest tall, knees over toes.', alts:['Goblet Squat','Leg Press','Hack Squat']},
      {id:'w2', name:'Romanian Deadlift', sets:3, reps:10, muscle:'Hamstrings', tip:'Push hips back.', alts:['Lying Leg Curl','Nordic Curl','Stiff-Leg Deadlift']},
      {id:'w3', name:'Leg Press', sets:3, reps:12, muscle:'Quads', tip:"Don't lock knees at top.", alts:['Smith Machine Squat','Step-Ups','Sissy Squat']},
      {id:'w4', name:'Walking Lunges', sets:3, reps:12, muscle:'Glutes', tip:'Torso upright, long strides.', alts:['Reverse Lunge','Hip Thrust','Glute Bridge']},
      {id:'w5', name:'Calf Raises', sets:4, reps:20, muscle:'Calves', tip:'Full stretch at bottom.', alts:['Seated Calf Raise','Leg Press Calf','Single-Leg Raise']}
    ]
  },
  Thursday: {
    label: 'CORE & REST', color: '#FFB300',
    exercises: [
      {id:'th1', name:'Plank', sets:3, reps:'60s', muscle:'Core', tip:'Straight line head to heel.', alts:['Ab Wheel Rollout','Dead Bug','Hollow Body Hold']},
      {id:'th2', name:'Hanging Leg Raises', sets:3, reps:12, muscle:'Lower Abs', tip:'No swinging.', alts:['Lying Leg Raise','Dragon Flag','V-Ups']},
      {id:'th3', name:'Cable Crunch', sets:3, reps:15, muscle:'Abs', tip:'Crunch to pelvis.', alts:['Crunch Machine','Decline Crunch','Sit-Ups']},
      {id:'th4', name:'Russian Twists', sets:3, reps:20, muscle:'Obliques', tip:'Rotate from torso.', alts:['Cable Woodchop','Pallof Press','Side Plank']}
    ]
  },
  Friday: {
    label: 'PUSH DAY II', color: '#A855F7',
    exercises: [
      {id:'f1', name:'DB Shoulder Press', sets:4, reps:10, muscle:'Shoulders', tip:'Full lockout overhead.', alts:['Barbell OHP','Machine Shoulder Press','Arnold Press']},
      {id:'f2', name:'Dips', sets:3, reps:12, muscle:'Chest/Triceps', tip:'Lean forward for more chest.', alts:['Cable Pushdown','Machine Dip','Bench Dip']},
      {id:'f3', name:'Cable Fly', sets:3, reps:15, muscle:'Chest', tip:'Hug-a-tree arc motion.', alts:['DB Fly','Pec Deck','Crossover']},
      {id:'f4', name:'Skull Crushers', sets:3, reps:12, muscle:'Triceps', tip:'Lock upper arms vertical.', alts:['Overhead Tricep Ext','Tricep Dips','JM Press']}
    ]
  },
  Saturday: { label: 'REST & RECOVER', color: '#6B7299', exercises: [] },
  Sunday: { label: 'REST & RECOVER', color: '#6B7299', exercises: [] }
};

// ═══════════════════════════════════════════════
// LIVE STATE MANAGEMENT
// ═══════════════════════════════════════════════
let state = {
  activeDay: DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1],
  wkDone: {}, // structure format: dayKey -> {date, exercises: []}
  currentProgress: {} // tracked workout entries
};

let timerInterval = null;
let timerSeconds = 0;

// LocalStorage Integration
function loadState() {
  try {
    const s = localStorage.getItem('shg_state');
    if (s) state = JSON.parse(s);
  } catch (e) { console.error("Error loading state", e); }
}

function saveState() {
  try {
    localStorage.setItem('shg_state', JSON.stringify(state));
  } catch (e) { console.error("Error saving state", e); }
}

// ═══════════════════════════════════════════════
// APPLICATION INITIALIZER & CORE ROUTER
// ═══════════════════════════════════════════════
window.onload = function() {
  loadState();
  buildDashboard();
  buildDayPills();
};

function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  
  document.getElementById('page-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  
  if (id === 'workout') buildWorkoutPage();
  if (id === 'dash') buildDashboard();
  if (id === 'history') buildHistory();
}

// ═══════════════════════════════════════════════
// DASHBOARD BUILDER METHODS
// ═══════════════════════════════════════════════
function buildDashboard() {
  const now = new Date();
  const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const todayName = DAYS[currentDayIndex];
  
  document.getElementById('header-today-day').textContent = todayName;
  document.getElementById('dash-day-label').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Routine Highlights
  const routineToday = ROUTINES[todayName];
  document.getElementById('dash-today-label').textContent = routineToday.label;
  document.getElementById('dash-today-excount').textContent = routineToday.exercises.length ? `${routineToday.exercises.length} Targeted Movements` : 'No Scheduled Exercises';

  // Statistics Computations
  const wkDoneArr = Object.values(state.wkDone);
  document.getElementById('stat-total').textContent = wkDoneArr.length;

  const weekStart = new Date(now); 
  weekStart.setDate(now.getDate() - currentDayIndex);
  weekStart.setHours(0,0,0,0);
  const weekDone = wkDoneArr.filter(s => new Date(s.date) >= weekStart).length;
  document.getElementById('stat-week').textContent = weekDone + '/7';

  // Streak Loop Logic
  let streak = 0;
  let checkDate = new Date(now);
  checkDate.setHours(0,0,0,0);
  
  for (let i = 0; i < 365; i++) {
    const targetString = checkDate.toDateString();
    const hit = wkDoneArr.some(s => new Date(s.date).toDateString() === targetString);
    if (hit) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (i === 0) { // check if yesterday had a workout to maintain continuity
        checkDate.setDate(checkDate.getDate() - 1);
        if (wkDoneArr.some(s => new Date(s.date).toDateString() === checkDate.toDateString())) {
          continue;
        }
      }
      break;
    }
  }
  
  document.getElementById('stat-streak').textContent = streak + '🔥';
  document.getElementById('streak-text').textContent = streak > 0 ? `${streak}-Day consistency streak! Keep pushing.` : 'No active streak. Complete a workout today!';

  buildCalendar(now);
  buildPeakChart();
}

// Calendar Dynamic Generation
function buildCalendar(now) {
  const labelsGrid = document.getElementById('cal-labels');
  const daysGrid = document.getElementById('cal-grid');
  labelsGrid.innerHTML = ''; daysGrid.innerHTML = '';

  const shortDays = ['M','T','W','T','F','S','S'];
  shortDays.forEach(d => labelsGrid.innerHTML += `<div>${d}</div>`);

  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  for(let i=0; i<offset; i++) {
    daysGrid.innerHTML += `<div></div>`;
  }

  const wkDoneArr = Object.values(state.wkDone);
  for(let day=1; day<=totalDays; day++) {
    const loopDate = new Date(now.getFullYear(), now.getMonth(), day);
    const isCompleted = wkDoneArr.some(s => new Date(s.date).toDateString() === loopDate.toDateString());
    const isToday = loopDate.toDateString() === now.toDateString();

    let cssClass = 'cal-day';
    if (isCompleted) cssClass += ' completed';
    if (isToday) cssClass += ' today';

    daysGrid.innerHTML += `<div class="${cssClass}">${day}</div>`;
  }
}

// Peak Traffic Simulator Visualizer
function buildPeakChart() {
  const chart = document.getElementById('peak-chart');
  chart.innerHTML = '';
  const hourlyTraffic = [15, 10, 8, 25, 55, 85, 90, 70, 45, 30, 50, 80, 95, 65, 20]; // 6 AM to 8 PM
  
  hourlyTraffic.forEach(vol => {
    let color = 'rgba(24,201,100,.5)'; // quiet
    if (vol > 40) color = 'rgba(232,160,32,.6)'; // moderate
    if (vol > 75) color = 'rgba(224,48,48,.6)'; // busy
    
    chart.innerHTML += `<div class="chart-bar" style="height:${vol}%; background:${color}"></div>`;
  });
}

// ═══════════════════════════════════════════════
// WORKOUT TRACKER BUILDERS
// ═══════════════════════════════════════════════
function buildDayPills() {
  const container = document.getElementById('day-scroll');
  container.innerHTML = '';
  DAYS.forEach(day => {
    const isActive = day === state.activeDay ? 'active' : '';
    container.innerHTML += `<button class="day-pill ${isActive}" onclick="selectWorkoutDay('${day}')">${day.substring(0,3)}</button>`;
  });
}

function selectWorkoutDay(day) {
  state.activeDay = day;
  buildDayPills();
  buildWorkoutPage();
}

function buildWorkoutPage() {
  const routine = ROUTINES[state.activeDay];
  document.getElementById('wk-title').textContent = routine.label;
  document.getElementById('wk-meta').textContent = `Weekly Routine Context: ${state.activeDay}`;
  
  const listContainer = document.getElementById('ex-list');
  listContainer.innerHTML = '';

  if (!routine.exercises.length) {
    listContainer.innerHTML = `<div class="card" style="text-align:center;color:var(--muted)">Rest Day! No actions needed.</div>`;
    updateProgressBar(0, 0);
    return;
  }

  // Active exercises iteration build
  routine.exercises.forEach(ex => {
    const isChecked = state.currentProgress[ex.id] ? 'checked' : '';
    listContainer.innerHTML += `
      <div class="ex-card">
        <div class="ex-row">
          <div>
            <div class="ex-name">${ex.name}</div>
            <div class="ex-target">${ex.muscle} • <span style="color:var(--gold)">${ex.tip}</span></div>
          </div>
          <div style="text-align:right">
            <div class="ex-sets-summary">${ex.sets}x${ex.reps}</div>
            <input type="checkbox" ${isChecked} style="margin-top:8px;transform:scale(1.3)" onclick="toggleExercise('${ex.id}')">
          </div>
        </div>
      </div>
    `;
  });

  recalculateProgress();
}

function toggleExercise(id) {
  if (state.currentProgress[id]) {
    delete state.currentProgress[id];
  } else {
    state.currentProgress[id] = true;
    showToast("Movement Completed! Starting rest timer...");
    startTimer(45); // auto rest trigger optimization
  }
  recalculateProgress();
}

function recalculateProgress() {
  const routine = ROUTINES[state.activeDay];
  if (!routine.exercises.length) return;

  let completeCount = 0;
  routine.exercises.forEach(ex => {
    if (state.currentProgress[ex.id]) completeCount++;
  });

  updateProgressBar(completeCount, routine.exercises.length);
}

function updateProgressBar(done, total) {
  document.getElementById('wk-done-n').textContent = done;
  document.getElementById('wk-tot-n').textContent = '/' + total;
  const pct = total > 0 ? (done / total) * 100 : 0;
  document.getElementById('prog-fill').style.width = `${pct}%`;
}

// ═══════════════════════════════════════════════
// SYSTEMS & LOGIC CONTROLLERS
// ═══════════════════════════════════════════════
function startTimer(duration) {
  clearInterval(timerInterval);
  timerSeconds = duration;
  
  timerInterval = setInterval(() => {
    timerSeconds--;
    const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const secs = (timerSeconds % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').textContent = `${mins}:${secs}`;

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      showToast("Rest Over! Return to your next set.");
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  document.getElementById('timer-display').textContent = "00:00";
}

function completeWorkout() {
  const routine = ROUTINES[state.activeDay];
  if(!routine.exercises.length) return;

  const timestamp = new Date().getTime();
  const uniqueKey = state.activeDay + '_' + timestamp;

  // Save session log data block
  state.wkDone[uniqueKey] = {
    date: new Date().toISOString(),
    day: state.activeDay,
    label: routine.label
  };

  // Clear session tracking cache variables
  state.currentProgress = {};
  saveState();
  showToast("Workout Logged Successfully!");
  showPage('dash', document.querySelectorAll('.nav-tab')[0]);
}

// ═══════════════════════════════════════════════
// HISTORY LOG VIEW MANIPULATOR
// ═══════════════════════════════════════════════
function buildHistory() {
  const container = document.getElementById('history-container');
  container.innerHTML = '';
  const logs = Object.values(state.wkDone).sort((a,b) => new Date(b.date) - new Date(a.date));

  if (!logs.length) {
    container.innerHTML = `<div class="card" style="text-align:center;color:var(--muted)">No logged history found yet.</div>`;
    return;
  }

  logs.forEach(log => {
    const formattedDate = new Date(log.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
    container.innerHTML += `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:700;font-size:15px">${log.label}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${log.day} • ${formattedDate}</div>
        </div>
        <div style="color:var(--green);font-size:12px;font-weight:700">✓ Logged</div>
      </div>
    `;
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}