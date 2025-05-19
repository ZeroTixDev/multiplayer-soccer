'use strict';

const copy = require('./copy.js');
const {
   // SPEED,
   SIMULATION_RATE,
   // CANVAS_HEIGHT,
   // CANVAS_WIDTH,
   // PADDLE_FRICTION,
   // BALL_MAX_SPEED,
   // // INPUT_DECAY,
   // phrases,
} = require('./constants.js');

function intersectRectCircle(rect, circle) {
   const cx = Math.abs(circle.x - rect.x - rect.width / 2);
   const xDist = rect.width / 2 + circle.radius;
   if (cx > xDist) return false;
   const cy = Math.abs(circle.y - rect.y - rect.height / 2);
   const yDist = rect.height / 2 + circle.radius;
   if (cy > yDist) return false;
   if (cx <= rect.width / 2 || cy <= rect.height / 2) return true;
   const xCornerDist = cx - rect.width / 2;
   const yCornerDist = cy - rect.height / 2;
   const xCornerDistSq = xCornerDist * xCornerDist;
   const yCornerDistSq = yCornerDist * yCornerDist;
   const maxCornerDistSq = circle.radius * circle.radius;
   return xCornerDistSq + yCornerDistSq <= maxCornerDistSq;
}

const knock = 200;
// const accel = 1100;
// const friction = 0.9;
const accel = 2000;
const friction = 0.85;
function simulatePlayer(player, state, Input, delta) {
   // delta = delta * 1.5;
   const input = Input === undefined ? player.input : Input;
   player.input = { up: input.up, left: input.left, down: input.down, right: input.right, shift: input.shift };
   if (input.up) {
      player.yv -= accel * delta * input.up;
   }
   if (input.down) {
      player.yv += accel * delta * input.down;
   }
   if (input.left) {
      player.xv -= accel * delta * input.left;
   }
   if (input.right) {
      player.xv += accel * delta * input.right;
   }
   player.xv *= Math.pow(friction, delta * 15);
   player.yv *= Math.pow(friction, delta * 15);
   // console.log(input);
   if (input.shift) {
      player.shift = true;
   } else {
      player.shift = false;
   }
   if (player.shift) {
      player.xv *= Math.pow(friction, delta * 20);
      player.yv *= Math.pow(friction, delta * 20);
   }
   player.x += player.xv * delta;
   player.y += player.yv * delta;

   if (player.x + player.radius > state.bound.width + state.bound.x) {
      player.x = state.bound.width + state.bound.x - player.radius;
      player.xv *= -0.5;
   }
   if (player.x - player.radius < state.bound.x) {
      player.x = state.bound.x + player.radius;
      player.xv *= -0.5;
   }
   if (player.y + player.radius > state.bound.y + state.bound.height) {
      player.y = state.bound.y + state.bound.height - player.radius;
      player.yv *= -0.5;
   }
   if (player.y - player.radius < state.bound.y) {
      player.y = state.bound.y + player.radius;
      player.yv *= -0.5;
   }

   const distX = player.x - state.ball.x;
   const distY = player.y - state.ball.y;
   if (distX * distX + distY * distY < (player.radius + state.ball.radius) * (player.radius + state.ball.radius)) {
      const v_collision = {
         x: player.x - state.ball.x,
         y: player.y - state.ball.y,
      };
      const distance = Math.sqrt(v_collision.x * v_collision.x + v_collision.y * v_collision.y);
      const v_collision_norm = {
         x: v_collision.x / distance,
         y: v_collision.y / distance,
      };
      const v_relative_velocity = {
         x: state.ball.xv - player.xv,
         y: state.ball.yv - player.yv,
      }; 
      const speed = v_relative_velocity.x * v_collision_norm.x + v_relative_velocity.y * v_collision_norm.y;
      if (speed > 0) {
         const impulse = (2 * speed) / (state.ball.radius + player.radius - 8);
         state.ball.xv -= impulse * player.radius * v_collision_norm.x * 1.2 * (player.shift ? 1.3: 0.7);
         state.ball.yv -= impulse * player.radius * v_collision_norm.y * 1.2 * (player.shift ? 1.3: 0.7);
         player.xv += impulse * state.ball.radius * v_collision_norm.x * 0.8;
         player.yv += impulse * state.ball.radius * v_collision_norm.y * 0.8;
      }
   }
   return player;
}

module.exports = function simulate(oldState, inputs) {
   const state = copy(oldState);
   const delta = 1 / SIMULATION_RATE;

   for (const playerId of Object.keys(state.players)) {
      state.players[playerId] = simulatePlayer(state.players[playerId], state, inputs[playerId], delta);
   }

   for (const i of Object.keys(state.players)) {
      const player1 = state.players[i];
      for (const j of Object.keys(state.players)) {
         if (i === j) continue;
         const player2 = state.players[j];
         const distX = player1.x - player2.x;
         const distY = player1.y - player2.y;
         if (distX * distX + distY * distY < player1.radius * 2 * (player2.radius * 2)) {
            const magnitude = Math.sqrt(distX * distX + distY * distY) || 1;
            const xv = distX / magnitude;
            const yv = distY / magnitude;
            player1.xv += xv * knock;
            player1.yv += yv * knock;
            player2.xv += -xv * knock;
            player2.yv += -yv * knock;
            player1.x = player2.x + (player1.radius + 0.05 + player2.radius) * xv;
            player1.y = player2.y + (player1.radius + 0.05 + player2.radius) * yv;
         }
      }
   }

   state.ball.x += state.ball.xv * delta;
   state.ball.y += state.ball.yv * delta;
   state.ball.xv *= Math.pow(0.99, delta * 30);
   state.ball.yv *= Math.pow(0.99, delta * 30);
   for (const goal of Object.values(state.goals)) {
      if (intersectRectCircle(goal, state.ball)) {
         // state.won = goal.team;
         state.ball.xv *= Math.pow(0.8, delta * 30);
         state.ball.yv *= Math.pow(0.8, delta * 30);
         if (state.ball.xv < 0.5 && state.ball.yv < 0.5) {
            state.won = goal.team;
         }
         // break;
         return state;
      }
   }
   if (!state.won) {
      if (state.ball.x + state.ball.radius > state.bound.width + state.bound.x) {
         state.ball.x = state.bound.width + state.bound.x - state.ball.radius;
         state.ball.xv *= -1;
      }
      if (state.ball.x - state.ball.radius < state.bound.x) {
         state.ball.x = state.bound.x + state.ball.radius;
         state.ball.xv *= -1;
      }
      if (state.ball.y + state.ball.radius > state.bound.y + state.bound.height) {
         state.ball.y = state.bound.y + state.bound.height - state.ball.radius;
         state.ball.yv *= -1;
      }
      if (state.ball.y - state.ball.radius < state.bound.y) {
         state.ball.y = state.bound.y + state.ball.radius;
         state.ball.yv *= -1;
      }
   }
   // for (const paddleId of Object.keys(state.paddles)) {
   //    const paddle = state.paddles[paddleId];
   //    if (paddle === undefined) continue;
   //    let input = inputs[paddleId];
   //    if (input !== undefined) {
   //       paddle.lastInput = {};
   //       paddle.lastInput.up = input.up;
   //       paddle.lastInput.down = input.down;
   //    } else if (input === undefined || input.up === undefined || input.down === undefined) {
   //       if (paddle.lastInput !== undefined) {
   //          paddle.lastInput.up *= INPUT_DECAY;
   //          paddle.lastInput.down *= INPUT_DECAY;
   //          input = {};
   //          input.up = paddle.lastInput.up;
   //          input.down = paddle.lastInput.down;
   //       }
   //    }
   //    if (input !== undefined) {
   //       if (input.up) {
   //          paddle.accel.y -= SPEED * delta * input.up;
   //       }
   //       if (input.down) {
   //          paddle.accel.y += SPEED * delta * input.down;
   //       }
   //       if (input.number) {
   //          paddle.text = phrases[input.number];
   //          paddle.textOpacity = 2;
   //       }
   //    }
   //    if (paddle.text !== undefined) {
   //       paddle.textOpacity -= delta;
   //       if (paddle.textOpacity <= 0) {
   //          paddle.text = undefined;
   //       }
   //    }
   //    paddle.accel.y *= Math.pow(PADDLE_FRICTION, delta * 20);
   //    paddle.y += paddle.accel.y * 20 * delta;
   //    paddle.height += 2 * delta;
   //    if (paddle.y > CANVAS_HEIGHT - paddle.height / 2) {
   //       paddle.y = CANVAS_HEIGHT - paddle.height / 2;
   //       paddle.accel.x = 0;
   //    }
   //    if (paddle.y - paddle.height / 2 < 0) {
   //       paddle.y = paddle.height / 2;
   //       paddle.accel.y = 0;
   //    }
   //    if (intersectRectCircle(paddle, state.ball)) {
   //       const dist = ((paddle.y - state.ball.y) / paddle.height) * 100;
   //       state.ball.yv += dist * -4; // here's the trick
   //       state.ball.xv *= -1.08;
   //       paddle.height -= 50;
   //       if (paddle.height < paddle.width) {
   //          paddle.height = paddle.width;
   //       }
   //    }
   //    // its not 0 because i want the prevent fake wins as much as possible ()
   //    if (
   //       (paddle.x < CANVAS_WIDTH / 2 && state.ball.x + state.ball.radius < -500) ||
   //       (paddle.x > CANVAS_WIDTH / 2 && state.ball.x + state.ball.radius > CANVAS_WIDTH + 500)
   //    ) {
   //       state.won = true;
   //       const otherPaddleId = Object.keys(state.scores).find((id) => id !== paddleId);
   //       state.scores[otherPaddleId]++;
   //       state.ball.x = CANVAS_WIDTH / 2;
   //       state.ball.y = CANVAS_HEIGHT / 2;

   //       const angle = Math.atan2((state.paddles[paddleId].y - state.ball.y), (state.paddles[paddleId].x - state.ball.x));
   //       state.ball.xv = Math.cos(angle) * state.ball.speed;
   //       state.ball.yv = Math.sin(angle) * state.ball.speed;

   //       for (const paddle of Object.values(state.paddles)) {
   //          // paddle.y = CANVAS_HEIGHT / 2;
   //          // paddle.accel = { x: 0, y: 0 };
   //          paddle.height = 300;
   //          paddle.lastInput = { up: false, down: false };
   //       }
   //       break;
   //    }
   // }

   return state;
};
