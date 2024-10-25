'use strict';

let gl;                         // The WebGL context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

// Параметри конуса
const a = 2;  // Радіус сфери
const p = 1;  // Константа для параметра omega

// Конвертація градусів в радіани
function deg2rad(angle) {
    return angle * Math.PI / 180;
}

// Конструктор для шейдерної програми
function ShaderProgram(program) {
    this.prog = program;
    this.iAttribVertex = -1;
    this.iModelViewProjectionMatrix = -1;
    this.iColor = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

// Конструктор для моделі поверхні
function Model() {
    this.iVertexBufferU = gl.createBuffer();
    this.iVertexBufferV = gl.createBuffer();
    this.countU = 0;
    this.countV = 0;

    this.BufferDataU = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBufferU);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.countU = vertices.length / 3;
    }

    this.BufferDataV = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBufferV);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.countV = vertices.length / 3;
    }

    this.DrawU = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBufferU);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINE_STRIP, 0, this.countU);
    }

    this.DrawV = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBufferV);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINE_STRIP, 0, this.countV);
    }
}

// Функція для створення даних поверхні конуса
function CreateSurfaceData() {
    let vertexListU = [];
    let vertexListV = [];
    let uSteps = 60;  
    let vSteps = 20;  
    let uMin = -Math.PI, uMax = Math.PI;  
    let vMin = -a, vMax = 0;  // Встановимо діапазон для v

    for (let i = 0; i <= uSteps; i++) {
        let u = uMin + (uMax - uMin) * i / uSteps;
        let omega = p * u;

        for (let j = 0; j <= vSteps; j++) {
            let v = vMin + (vMax - vMin) * j / vSteps;

            // Параметричні рівняння
            let x = (a + v) * Math.cos(omega) * Math.cos(u);
            let y = (a + v) * Math.cos(omega) * Math.sin(u);
            let z = (a + v) * Math.sin(omega);

            vertexListU.push(x, y, z);
        }
    }

    for (let j = 0; j <= vSteps; j++) {
        let v = vMin + (vMax - vMin) * j / vSteps;

        for (let i = 0; i <= uSteps; i++) {
            let u = uMin + (uMax - uMin) * i / uSteps;
            let omega = p * u;

            let x = (a + v) * Math.cos(omega) * Math.cos(u);
            let y = (a + v) * Math.cos(omega) * Math.sin(u);
            let z = (a + v) * Math.sin(omega);

            vertexListV.push(x, y, z);
        }
    }

    return { vertexListU, vertexListV };
}





// Ініціалізація WebGL
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram(prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");

    let surfaceData = CreateSurfaceData();
    surface = new Model();
    surface.BufferDataU(surfaceData.vertexListU);
    surface.BufferDataV(surfaceData.vertexListV);

    gl.enable(gl.DEPTH_TEST);
}

// Функція малювання
function draw() { 
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projection = m4.perspective(Math.PI/6, 1, 8, 12); 
    let modelView = spaceball.getViewMatrix();
    let translateToPointZero = m4.translation(0, 0, -10);
    let matAccum = m4.multiply(translateToPointZero, modelView);
    let modelViewProjection = m4.multiply(projection, matAccum);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    
    // Малюємо U лінії (червоний)
    gl.uniform4fv(shProgram.iColor, [1, 0, 0, 1]); // Червоний
    surface.DrawU();

    // Малюємо V лінії (синій)
    gl.uniform4fv(shProgram.iColor, [0, 0, 1, 1]); // Синій
    surface.DrawV();
}

// Створення програми
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader: " + gl.getShaderInfoLog(vsh));
    }

    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader: " + gl.getShaderInfoLog(fsh));
    }

    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program: " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

// Ініціалізація
function init() {
    let canvas = document.getElementById("webglcanvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        document.getElementById("canvas-holder").innerHTML = "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    initGL();
    spaceball = new TrackballRotator(canvas, draw, 0);
    draw();
}

