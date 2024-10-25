// Конструктор для моделі поверхні
function Model() {
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length / 3;
    }

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINES, 0, this.count);
    }
}
function ConicalSurfaceModel(a, p, uSegments, vSegments) {
    this.a = a;
    this.p = p;
    this.uSegments = uSegments;
    this.vSegments = vSegments;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    // Параметричні рівняння поверхні
    this.surfaceFunction = function(u, v) {
        let omega = this.p * u;
        let x = (this.a + v) * Math.cos(omega) * Math.cos(u);
        let y = (this.a + v) * Math.cos(omega) * Math.sin(u);
        let z = (this.a + v) * Math.sin(omega);
        return [x, y, z];
    };

    // Генерація поліліній для U і V
    this.generateWireframe = function() {
        let vertexList = [];

        // Полілінії по U
        for (let u = 0; u <= 2 * Math.PI; u += 2 * Math.PI / this.uSegments) {
            for (let v = -1; v <= 1; v += 2 / this.vSegments) {
                let vertex = this.surfaceFunction(u, v);
                vertexList.push(...vertex);
            }
        }

        // Полілінії по V
        for (let v = -1; v <= 1; v += 2 / this.vSegments) {
            for (let u = 0; u <= 2 * Math.PI; u += 2 * Math.PI / this.uSegments) {
                let vertex = this.surfaceFunction(u, v);
                vertexList.push(...vertex);
            }
        }

        return vertexList;
    };

    // Заповнення буферу WebGL
    this.BufferData = function() {
        let vertices = this.generateWireframe();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length / 3;
    };

    // Малювання поверхні
    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINES, 0, this.count);
    };
}
