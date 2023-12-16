import React, { createRef } from "react"
import "./Game.scss"
import { SvgArrowDown, SvgArrowLeft, SvgArrowRight, SvgArrowUp } from "./Icons"

export default class Game extends React.Component {
    constructor(props) {
        super(props)
        this.mobileWidth = 660
        this.canvas = createRef()
        this.audioPlayer = createRef()
        this.cellSize = 30
        this.cellsX = 0
        this.cellsY = 0
        this.directions = {
            left: 0,
            up: 1,
            right: 2,
            down: 3
        }
        this.direction = null
        this.snake = []
        this.appleCoords = null
        this.state = {
            lost: false,
            running: false,
            canvasWidth: 0,
            canvasHeight: 0,
            blocked: false,
            score: 0
        }
    }

    setCanvasDimensions = () => {
        let { width, height } = this.canvas.current.parentNode.getBoundingClientRect(),
            canvasWidth = width - (width % this.cellSize),
            canvasHeight = height - (height % this.cellSize)
        this.cellsX = canvasWidth / this.cellSize
        this.cellsY = canvasHeight / this.cellSize
        this.setState({ canvasWidth, canvasHeight })
    }

    setDirection = newDirection => {
        if (this.state.blocked || this.direction === newDirection) return false
        switch (newDirection) {
            case this.directions.left:
                if (this.direction === this.directions.right) return false
                break
            case this.directions.up:
                if (this.direction === this.directions.down) return false
                break
            case this.directions.right:
                if (this.direction === this.directions.left) return false
                break
            case this.directions.down:
                if (this.direction === this.directions.up) return false
                break
        }
        this.direction = newDirection
        this.setState({ blocked: true })
    }

    onKeyPress = event => {
        event.preventDefault()
        if (event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40) {
            this.setDirection(parseInt(event.keyCode - 37))
        }
    }

    checkRules = () => {
        let head = this.snake[0],
            body = [...this.snake].slice(1)
        if (head[0] < 0 || head[0] >= this.cellsX || head[1] < 0 || head[1] >= this.cellsY) return false
        return !body.some(slice => slice[0] === head[0] && slice[1] === head[1])
    }

    canEat = () => this.snake[0][0] === this.appleCoords[0] && this.snake[0][1] === this.appleCoords[1]

    respawnApple = excludeCoords => {
        let randomX, randomY
        do {
            randomX = Math.floor(Math.random() * this.cellsX)
            randomY = Math.floor(Math.random() * this.cellsY)
        } while (
            (randomX === excludeCoords[0] && randomY === excludeCoords[1]) ||
            this.snake.some(slice => slice[0] === randomX && slice[1] === randomY)
        )
        this.appleCoords = [randomX, randomY]
    }

    run = () => {
        let context = this.canvas.current.getContext("2d"), lastCoords
        context.clearRect(0, 0, this.state.canvasWidth, this.state.canvasHeight)

        // Render snake
        context.beginPath()
        context.fillStyle = "#009500"
        context.fill()
        this.snake.forEach((coords, i) => {
            if (i === 0) {
                lastCoords = [...coords]
                switch (this.direction) {
                    case this.directions.left:
                        this.snake[i][0] -= 1
                        break
                    case this.directions.up:
                        this.snake[i][1] -= 1
                        break
                    case this.directions.right:
                        this.snake[i][0] += 1
                        break
                    case this.directions.down:
                        this.snake[i][1] += 1
                        break
                }
                if (this.canEat()) {
                    this.respawnApple(lastCoords)
                    this.snake.push([...lastCoords])
                    this.setState({ score: this.state.score + 1 })
                }
            } else {
                this.snake[i] = [...lastCoords]
                lastCoords = coords
            }
        })
        this.snake.forEach(coords => {
            context.fillRect(
                coords[0] * this.cellSize,
                coords[1] * this.cellSize,
                this.cellSize,
                this.cellSize
            )
        })
        context.closePath()

        // Render apple
        context.beginPath()
        context.arc(
            (this.appleCoords[0] + 1 / 2) * this.cellSize,
            (this.appleCoords[1] + 1 / 2) * this.cellSize,
            this.cellSize / 2,
            0, Math.PI * 2, false
        )
        context.fillStyle = "#f00"
        context.fill()
        context.closePath()

        // Unblock keys
        this.setState({ blocked: false })

        // Check rules and continue
        if (this.checkRules()) return setTimeout(this.run, 200)

        this.audioPlayer.current.play()
        this.setState({ running: false, lost: true })
    }

    init = async () => {
        this.setState({ lost: false, running: true, score: 0 })
        this.snake = [[1, 1]]
        this.direction = this.directions.right
        this.respawnApple([2, 1])
        this.run()
    }

    componentDidMount() {
        this.setCanvasDimensions()
        document.addEventListener("keydown", this.onKeyPress)
    }

    render() {
        return (
            <main className="game-container">
                <audio src="Game Over.mp3" ref={this.audioPlayer} hidden></audio>
                {!this.state.running &&
                    <div className="message-container" onClick={this.init}>
                        {this.state.lost ?
                            <>
                                <h1 className="lost">Your snake has died :(</h1>
                                <h2>Your score: {this.state.score}</h2>
                                <h4>Press to restart</h4>
                            </> :
                            <h1>Press to start :)</h1>
                        }
                    </div>
                }
                <div className="canvas-container">
                    <h4 className="score">Score: {this.state.score}</h4>
                    <div className="canvas">
                        <canvas
                            ref={this.canvas}
                            width={this.state.canvasWidth}
                            height={this.state.canvasHeight}
                        >
                        </canvas>
                    </div>
                </div>
                {
                    window.innerWidth < this.mobileWidth &&
                    <ul className="controls-container">
                        <button onClick={() => this.setDirection(this.directions.up)}><SvgArrowUp /></button>
                        <div className="center-controls-container">
                            <button onClick={() => this.setDirection(this.directions.left)}><SvgArrowLeft /></button>
                            <button onClick={() => this.setDirection(this.directions.right)}><SvgArrowRight /></button>
                        </div>
                        <button onClick={() => this.setDirection(this.directions.down)}><SvgArrowDown /></button>
                    </ul>
                }
            </main >
        )
    }
}