// Page curl adapted from https://github.com/dfabulich/webgl-page-curl
// Copyright 2025 Dan Fabulich
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

const CURL_DURATION_MS = 1200
const CURL_RADIUS = 0.2

// Lower-left to upper-right. WebGL UVs put y = 1 at the top of the image.
const CURL_START = { x: 0, y: 0 }
const CURL_END = { x: 1, y: 1 }

const vertexShaderSource = `
	attribute vec2 a_position;
	attribute vec2 a_texCoord;
	varying vec2 vUv;

	void main() {
		vUv = a_texCoord;
		gl_Position = vec4(a_position, 0.0, 1.0);
	}
`

const fragmentShaderSource = `
	precision mediump float;

	#define PI 3.14159265359

	uniform float curlAmount;
	uniform float radius;
	uniform vec2 start;
	uniform vec2 end;
	uniform sampler2D t;

	varying vec2 vUv;

	bool isInBounds(vec2 uvCoords) {
		return uvCoords.x >= 0.0 && uvCoords.x <= 1.0 && uvCoords.y >= 0.0 && uvCoords.y <= 1.0;
	}

	void main() {
		float _curlAmount = curlAmount;
		float _radius = radius;
		vec2 curlStartPos = start;
		vec2 curlEndTargetPos = end;

		if (!isInBounds(vUv)) {
			discard;
		}

		if (_curlAmount < 0.0001) {
			gl_FragColor = texture2D(t, vUv);
			return;
		}

		vec2 curlPathVector = curlEndTargetPos - curlStartPos;
		float curlPathLength = length(curlPathVector) + (_radius * PI);
		vec2 curlPathDir = normalize(curlPathVector);
		float curlProgressDist = _curlAmount * curlPathLength;
		vec2 curlAxisPos = curlStartPos + curlPathDir * curlProgressDist;
		vec2 axisReferenceDir = -curlPathDir;

		vec2 refPoint = curlStartPos;
		vec2 fragmentVecFromRef = vUv - refPoint;
		vec2 curlAxisVecFromRef = curlAxisPos - refPoint;
		float distCurlAxisFromOrigin = dot(curlAxisVecFromRef, axisReferenceDir);
		float distFragmentAlongAxisRefDir = dot(fragmentVecFromRef, axisReferenceDir);

		float distFragmentFromCurlAxis = distFragmentAlongAxisRefDir - distCurlAxisFromOrigin;
		vec4 color = vec4(0.0);

		if (distFragmentFromCurlAxis > _radius) {
			color.a = 1.0 - pow(clamp((distFragmentFromCurlAxis - _radius) / _radius, 0.0, 1.0) * 1.5, 0.2);
		} else if (distFragmentFromCurlAxis >= 0.0) {
			vec2 linePoint = vUv - distFragmentFromCurlAxis * axisReferenceDir;
			float asinInput = clamp(distFragmentFromCurlAxis / _radius, -1.0, 1.0);
			float theta = asin(asinInput);
			float distForP1 = theta * _radius;
			vec2 p1 = linePoint + axisReferenceDir * distForP1;
			float angleForP2 = PI - theta;
			float distForP2 = angleForP2 * _radius;
			vec2 p2 = linePoint + axisReferenceDir * distForP2;
			bool seeingBack = isInBounds(p2);

			if (seeingBack) {
				color = texture2D(t, p2);
				color.rgb *= 0.9;
			} else {
				color = texture2D(t, p1);
				float light = 0.7 + 0.3 * cos(theta);
				color.rgb *= light;
			}
		} else {
			vec2 linePoint = vUv - distFragmentFromCurlAxis * axisReferenceDir;
			float distForP = PI * _radius + abs(distFragmentFromCurlAxis);
			vec2 p = linePoint + axisReferenceDir * distForP;

			if (isInBounds(p)) {
				color = texture2D(t, p);
				color.rgb *= 0.9;
			} else {
				color = texture2D(t, vUv);
			}
		}

		gl_FragColor = color;
	}
`

type CurlRenderer = {
	canvas: HTMLCanvasElement
	gl: WebGLRenderingContext
	program: WebGLProgram
	texture: WebGLTexture
	positionBuffer: WebGLBuffer
	texCoordBuffer: WebGLBuffer
	positionLoc: number
	texCoordLoc: number
	curlAmountLoc: WebGLUniformLocation
	radiusLoc: WebGLUniformLocation
	startLoc: WebGLUniformLocation
	endLoc: WebGLUniformLocation
	textureLoc: WebGLUniformLocation
}

const renderers = new WeakMap<HTMLCanvasElement, PageCurl>()
let webglFailed = false

function must<T>(value: T | null, message: string): T {
	if (value === null) throw new Error(message)
	return value
}

function compileShader(gl: WebGLRenderingContext, source: string, type: number) {
	const shader = must(gl.createShader(type), 'Failed to create shader')
	gl.shaderSource(shader, source)
	gl.compileShader(shader)

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(shader)
		gl.deleteShader(shader)
		throw new Error(info ?? 'Failed to compile shader')
	}

	return shader
}

function createRenderer(canvas: HTMLCanvasElement): CurlRenderer {
	const gl = must(
		canvas.getContext('webgl', {
			alpha: true,
			antialias: false,
			depth: false,
			stencil: false,
			premultipliedAlpha: true,
		}),
		'WebGL is not available',
	)

	const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER)
	const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER)
	const program = must(gl.createProgram(), 'Failed to create shader program')
	gl.attachShader(program, vertexShader)
	gl.attachShader(program, fragmentShader)
	gl.linkProgram(program)
	gl.deleteShader(vertexShader)
	gl.deleteShader(fragmentShader)

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const info = gl.getProgramInfoLog(program)
		gl.deleteProgram(program)
		throw new Error(info ?? 'Failed to link shader program')
	}

	const positionLoc = gl.getAttribLocation(program, 'a_position')
	const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord')
	if (positionLoc < 0 || texCoordLoc < 0) {
		throw new Error('Missing shader attributes')
	}

	const positionBuffer = must(gl.createBuffer(), 'Failed to create position buffer')
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		-1, 1,
		-1, -1,
		1, 1,
		1, -1,
	]), gl.STATIC_DRAW)

	const texCoordBuffer = must(gl.createBuffer(), 'Failed to create texCoord buffer')
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		0, 1,
		0, 0,
		1, 1,
		1, 0,
	]), gl.STATIC_DRAW)

	const texture = must(gl.createTexture(), 'Failed to create texture')
	gl.bindTexture(gl.TEXTURE_2D, texture)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

	return {
		canvas,
		gl,
		program,
		texture,
		positionBuffer,
		texCoordBuffer,
		positionLoc,
		texCoordLoc,
		curlAmountLoc: must(gl.getUniformLocation(program, 'curlAmount'), 'Missing curlAmount'),
		radiusLoc: must(gl.getUniformLocation(program, 'radius'), 'Missing radius'),
		startLoc: must(gl.getUniformLocation(program, 'start'), 'Missing start'),
		endLoc: must(gl.getUniformLocation(program, 'end'), 'Missing end'),
		textureLoc: must(gl.getUniformLocation(program, 't'), 'Missing texture'),
	}
}

function resize(curl: CurlRenderer) {
	const dpr = Math.min(window.devicePixelRatio || 1, 2)
	const width = Math.max(1, Math.round(curl.canvas.clientWidth * dpr))
	const height = Math.max(1, Math.round(curl.canvas.clientHeight * dpr))

	if (curl.canvas.width !== width || curl.canvas.height !== height) {
		curl.canvas.width = width
		curl.canvas.height = height
	}
}

function upload(curl: CurlRenderer, image: HTMLImageElement) {
	const { gl, texture } = curl
	gl.bindTexture(gl.TEXTURE_2D, texture)
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
}

function draw(curl: CurlRenderer, amount: number) {
	const { gl } = curl
	resize(curl)
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
	gl.clearColor(0, 0, 0, 0)
	gl.clear(gl.COLOR_BUFFER_BIT)
	gl.useProgram(curl.program)

	gl.bindBuffer(gl.ARRAY_BUFFER, curl.positionBuffer)
	gl.enableVertexAttribArray(curl.positionLoc)
	gl.vertexAttribPointer(curl.positionLoc, 2, gl.FLOAT, false, 0, 0)

	gl.bindBuffer(gl.ARRAY_BUFFER, curl.texCoordBuffer)
	gl.enableVertexAttribArray(curl.texCoordLoc)
	gl.vertexAttribPointer(curl.texCoordLoc, 2, gl.FLOAT, false, 0, 0)

	gl.activeTexture(gl.TEXTURE0)
	gl.bindTexture(gl.TEXTURE_2D, curl.texture)
	gl.uniform1i(curl.textureLoc, 0)
	gl.uniform1f(curl.curlAmountLoc, amount)
	gl.uniform1f(curl.radiusLoc, CURL_RADIUS)
	gl.uniform2f(curl.startLoc, CURL_START.x, CURL_START.y)
	gl.uniform2f(curl.endLoc, CURL_END.x, CURL_END.y)
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

function easeOut(t: number) {
	return 1 - (1 - t) ** 3
}

function animate(curl: CurlRenderer) {
	return new Promise<void>((resolve) => {
		const started = performance.now()

		function frame(now: number) {
			const progress = Math.min((now - started) / CURL_DURATION_MS, 1)
			draw(curl, easeOut(progress))

			if (progress < 1) requestAnimationFrame(frame)
			else resolve()
		}

		requestAnimationFrame(frame)
	})
}

export type PageCurl = {
	play(image: HTMLImageElement): Promise<void>
}

export function createPageCurl(canvas: HTMLCanvasElement): PageCurl {
	const existing = renderers.get(canvas)
	if (existing) return existing
	if (webglFailed) throw new Error('WebGL is not available')

	try {
		const curl = createRenderer(canvas)
		const pageCurl = {
			async play(image: HTMLImageElement) {
				upload(curl, image)
				draw(curl, 0)
				await animate(curl)
			},
		}
		renderers.set(canvas, pageCurl)
		return pageCurl
	} catch (error) {
		webglFailed = true
		throw error
	}
}
