var PointCalibrate = 0;
var CalibrationPoints={};

// Find the help modal
var helpModal;

/**
 * Clear the canvas and the calibration button.
 */
function ClearCanvas(){
  document.querySelectorAll('.Calibration').forEach((i) => {
    i.style.setProperty('display', 'none');
  });
  var canvas = document.getElementById("plotting_canvas");
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Show the instruction of using calibration at the start up screen.
 */
function PopUpInstruction(){
  ClearCanvas();
  Swal.fire({
    title: "Calibration",
    text: "Please click on each of the 9 points on the screen. You must click on each point 5 times till it goes yellow. This will calibrate your eye movements.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: false,
    confirmButtonText: "Start Calibration"
  }).then((result) => {
    if (result.isConfirmed) {
      ShowCalibrationPoint();
    }
  });
}

/**
  * Show the help instructions right at the start.
  */
function helpModalShow() {
    if(!helpModal) {
        helpModal = new bootstrap.Modal(document.getElementById('helpModal'))
    }
    helpModal.show();
}

function calcAccuracy() {
    // show modal
    // notification for the measurement process
    Swal.fire({
        title: "Calculating measurement",
        text: "Please don't move your mouse & stare at the middle dot for the next 5 seconds. This will allow us to calculate the accuracy of our predictions.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: true,
        confirmButtonText: "Start Measurement"
    }).then((result) => {
        if (result.isConfirmed) {
            // Start storing points after user confirms
            store_points_variable();
            
            // Show a countdown
            let timeLeft = 5;
            const countdownInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft > 0) {
                    Swal.update({
                        title: `Calculating measurement`,
                        text: `Please don't move your mouse & stare at the middle dot for the next ${timeLeft} seconds.`
                    });
                } else {
                    clearInterval(countdownInterval);
                    stop_storing_points_variable();
                    var past50 = webgazer.getStoredPoints();
                    var precision_measurement = calculatePrecision(past50);
                    var accuracyLabel = "<a>Accuracy | "+precision_measurement+"%</a>";
                    document.getElementById("Accuracy").innerHTML = accuracyLabel;
                    
                    // Show the Check Precision button
                    document.getElementById("checkPrecisionBtn").style.display = "block";
                    
                    Swal.fire({
                        title: "Your accuracy measure is " + precision_measurement + "%",
                        allowOutsideClick: false,
                        showCancelButton: true,
                        confirmButtonText: "Done",
                        cancelButtonText: "Recalibrate"
                    }).then((result) => {
                        if (result.isConfirmed) {
                            //clear the calibration & hide the last middle button
                            ClearCanvas();
                        } else {
                            //use restart function to restart the calibration
                            document.getElementById("Accuracy").innerHTML = "<a>Not yet Calibrated</a>";
                            webgazer.clearData();
                            ClearCalibration();
                            ClearCanvas();
                            ShowCalibrationPoint();
                            // Hide the Check Precision button when recalibrating
                            document.getElementById("checkPrecisionBtn").style.display = "none";
                        }
                    });
                }
            }, 1000);
        }
    });
}

/**
 * Function to check precision at any time after calibration
 */
function checkPrecision() {
    // Show the center dot
    document.getElementById('Pt5').style.removeProperty('display');
    
    Swal.fire({
        title: "Checking precision",
        text: "Please don't move your mouse & stare at the middle dot for the next 5 seconds.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: true,
        confirmButtonText: "Start Measurement"
    }).then((result) => {
        if (result.isConfirmed) {
            store_points_variable();
            
            let timeLeft = 5;
            const countdownInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft > 0) {
                    Swal.update({
                        title: `Checking precision`,
                        text: `Please don't move your mouse & stare at the middle dot for the next ${timeLeft} seconds.`
                    });
                } else {
                    clearInterval(countdownInterval);
                    stop_storing_points_variable();
                    var past50 = webgazer.getStoredPoints();
                    var precision_measurement = calculatePrecision(past50);
                    var accuracyLabel = "<a>Accuracy | "+precision_measurement+"%</a>";
                    document.getElementById("Accuracy").innerHTML = accuracyLabel;
                    
                    // Hide the center dot after measurement
                    document.getElementById('Pt5').style.setProperty('display', 'none');
                    
                    // Clear the canvas to remove prediction points
                    var canvas = document.getElementById("plotting_canvas");
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                    
                    Swal.fire({
                        title: "Your current precision is " + precision_measurement + "%",
                        allowOutsideClick: false,
                        showCancelButton: true,
                        confirmButtonText: "Done",
                        cancelButtonText: "Recalibrate"
                    }).then((result) => {
                        if (!result.isConfirmed) {
                            //use restart function to restart the calibration
                            document.getElementById("Accuracy").innerHTML = "<a>Not yet Calibrated</a>";
                            webgazer.clearData();
                            ClearCalibration();
                            ClearCanvas();
                            ShowCalibrationPoint();
                            document.getElementById("checkPrecisionBtn").style.display = "none";
                        }
                    });
                }
            }, 1000);
        } else {
            // If user cancels, hide the center dot
            document.getElementById('Pt5').style.setProperty('display', 'none');
            // Clear the canvas if user cancels
            var canvas = document.getElementById("plotting_canvas");
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
    });
}

function calPointClick(node) {
    const id = node.id;

    if (!CalibrationPoints[id]){ // initialises if not done
        CalibrationPoints[id]=0;
    }
    CalibrationPoints[id]++; // increments values

    if (CalibrationPoints[id]==5){ //only turn to yellow after 5 clicks
        node.style.setProperty('background-color', 'yellow');
        node.setAttribute('disabled', 'disabled');
        PointCalibrate++;
    }else if (CalibrationPoints[id]<5){
        //Gradually increase the opacity of calibration points when click to give some indication to user.
        var opacity = 0.2*CalibrationPoints[id]+0.2;
        node.style.setProperty('opacity', opacity);
    }

    //Show the middle calibration point after all other points have been clicked.
    if (PointCalibrate == 8){
        document.getElementById('Pt5').style.removeProperty('display');
    }

    if (PointCalibrate >= 9){ // last point is calibrated
        // grab every element in Calibration class and hide them except the middle point.
        document.querySelectorAll('.Calibration').forEach((i) => {
            i.style.setProperty('display', 'none');
        });
        document.getElementById('Pt5').style.removeProperty('display');

        // clears the canvas
        var canvas = document.getElementById("plotting_canvas");
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        // Calculate the accuracy
        calcAccuracy();
    }
}

/**
 * Load this function when the index page starts.
* This function listens for button clicks on the html page
* checks that all buttons have been clicked 5 times each, and then goes on to measuring the precision
*/
//$(document).ready(function(){
function docLoad() {
  ClearCanvas();
  helpModalShow();
    
    // click event on the calibration buttons
    document.querySelectorAll('.Calibration').forEach((i) => {
        i.addEventListener('click', () => {
            calPointClick(i);
        })
    })
};
window.addEventListener('load', docLoad);

/**
 * Show the Calibration Points
 */
function ShowCalibrationPoint() {
  document.querySelectorAll('.Calibration').forEach((i) => {
    i.style.removeProperty('display');
  });
  // initially hides the middle button
  document.getElementById('Pt5').style.setProperty('display', 'none');
}

/**
* This function clears the calibration buttons memory
*/
function ClearCalibration(){
  // Clear data from WebGazer

  document.querySelectorAll('.Calibration').forEach((i) => {
    i.style.setProperty('background-color', 'red');
    i.style.setProperty('opacity', '0.2');
    i.removeAttribute('disabled');
  });

  CalibrationPoints = {};
  PointCalibrate = 0;
}

// sleep function because java doesn't have one, sourced from http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
