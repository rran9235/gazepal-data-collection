// Get Canvas element
const canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// Set body margin to 0
const body = document.querySelector('body');
body.style.margin = 0;
// Get context for drawing
const ctx = canvas.getContext('2d');

// Define screen region sizes
const region_width = ctx.canvas.clientWidth/3;
const region_height = ctx.canvas.clientHeight/3;
// Vertical movement
const dy = region_height/6;
// 
const vertical_time = 100;
const horizontal_time = 200;
const new_row_time = 500;
const pause_time = 100;

const videoMediaConstraints = {audio: false,video: true,};

// Initialise variables
var pos_x;
var pos_y;
var new_x;
var new_y;
var start_time;
var padding = 30;
var now_row = 1;
var now_col = 1;
var now_line = 0;
var duration;
var paused = true;
let chunks = [];

function draw_grid()
{
	// Find screen region height and width
	var region_width = ctx.canvas.clientWidth/3;
	var region_height = ctx.canvas.clientHeight/3;
	
	ctx.beginPath();
	
	// Draw horizontal lines
	ctx.moveTo(0*region_width, 1*region_height);
	ctx.lineTo(3*region_width, 1*region_height);
	ctx.moveTo(3*region_width, 2*region_height);
	ctx.lineTo(0*region_width, 2*region_height);
	// Draw vertical lines
	ctx.moveTo(2*region_width, 3*region_height);
	ctx.lineTo(2*region_width, 0*region_height);
	ctx.moveTo(1*region_width, 0*region_height);
	ctx.lineTo(1*region_width, 3*region_height);
	ctx.lineWidth = 1;
	ctx.strokeStyle = '#000000';
	ctx.stroke();

	ctx.closePath();
}

function draw_marker(pos_x, pos_y)
{	
	ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
	draw_grid()
	ctx.beginPath();

	let radius = 15
	
	ctx.moveTo(pos_x + radius, pos_y);
	ctx.arc(pos_x, pos_y, radius, 0, 2*Math.PI);
	
	ctx.fillStyle = 'red';
	ctx.fill();
	ctx.lineWidth = 1;
	ctx.strokeStyle = '#003300';
	ctx.stroke();
	
	ctx.closePath();
}

function region_animate_logic()
{

	if (now_line == 0)
	{
		pos_x = padding + (now_col - 1)*region_width;
		pos_y = dy + (now_row - 1)*region_height;
		new_x = padding + (now_col - 1)*region_width;
		new_y = dy + (now_row - 1)*region_height;
		duration = pause_time;
	}
	else if (now_line == 1)
	{
		new_x = (now_col + 0)*region_width - padding;
		duration = horizontal_time;
	}
	else if (now_line == 2)
	{
		new_y = pos_y + 2*dy;
		duration = vertical_time;
	}
	else if (now_line == 3)
	{
		new_x = (now_col - 1)*region_width + 30;
		duration = horizontal_time;
	}
	else if (now_line == 4)
	{
		new_y = pos_y + 2*dy;
		duration = vertical_time;
	}
	else if (now_line == 5)
	{
		new_x = (now_col + 0)*region_width - 30;
		duration = horizontal_time;
	}
	else if (now_line == 6)
	{
		duration = pause_time;
	}
	else if (now_line == 7)
	{
		now_line = -1;
		if (now_col == 3)
		{
			if (now_row == 3)
			{
				now_line = 10;
				stopRecording();
				return;
			}
			else
			{
				now_col = 1;
				now_row += 1;
				duration = new_row_time;
			}
		}
		else 
		{
			now_col += 1;
			duration = horizontal_time;
		}
		
		new_x = 30 + (now_col - 1)*region_width;
		new_y = dy + (now_row - 1)*region_height;
	}

}

function animate(time)
{
	if (paused)
	{
		return;
	}

	if (!start_time)
	{
		start_time = time || performance.now();
	}

	var dT = (time - start_time)/duration;

	var now_x = pos_x + ((new_x - pos_x) * dT);
	var now_y = pos_y + ((new_y - pos_y) * dT);

	if (dT >= 1)
	{
		pos_x = new_x;
		pos_y = new_y;
		start_time = null;
		
		draw_marker(ctx, pos_x, pos_y);
		now_line += 1
		region_animate_logic(now_line);
	}
	else
	{
		draw_marker(now_x, now_y);
		requestAnimationFrame(animate);
	}

}

function start_btn()
{
	// document.getElementById('canvas-div').style.display = 'block';
	document.getElementById('start-btn').style.display = 'none';
	startRecording();
}

function startRecording() {

	// Access the camera and microphone
	navigator.mediaDevices.getUserMedia(videoMediaConstraints).then((mediaStream) => 
		{
			// Create a new MediaRecorder instance
			const mediaRecorder = new MediaRecorder(mediaStream);

			//Make the mediaStream global
			window.mediaStream = mediaStream;
			//Make the mediaRecorder global
			window.mediaRecorder = mediaRecorder;

			mediaRecorder.start();
			paused = false;

			mediaRecorder.ondataavailable = (e) => 
			{
				chunks.push(e.data);
			};

		mediaRecorder.onstop = () => 
		{
			const blob = new Blob(chunks, {type: "video/mp4"});
			chunks = [];


			const recordedMedia = document.createElement("video");
			recordedMedia.controls = true;

			const recordedMediaURL = URL.createObjectURL(blob);

			recordedMedia.src = recordedMediaURL;

			const downloadButton = document.createElement("a");
			
			downloadButton.download = "Recorded-Media";
			
			downloadButton.href = recordedMediaURL;
			downloadButton.innerText = "Download video";
			
			downloadButton.onclick = () => 
			{
				URL.revokeObjectURL(recordedMedia);
			};
			
			document.getElementById('buttons').append(downloadButton);
			document.getElementById('canvas-div').style.display = 'none';
			
		};

		// webCamContainer.srcObject = mediaStream;
	});
}

function stopRecording()
{
	// Stop the recording
	window.mediaRecorder.stop();

	// Stop all the tracks in the
	// received media stream
	window.mediaStream.getTracks().forEach((track) => 
	{
		track.stop();
	});
}

region_animate_logic(now_line)
animate();
setInterval(animate, 10);
