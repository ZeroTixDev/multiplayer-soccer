'use strict';

const ref = require('../references.js');
const canvas = ref.canvas;
const simulate = require('../../shared/simulate.js');
const copy = require('../../shared/copy.js');
const ctx = canvas.getContext('2d');
const { SIMULATION_RATE, SMOOTHING_RATE } = require('../../shared/constants.js');

module.exports = function Update(game) {
   // do something smart with game
   if (
      game === undefined ||
      game.startTime === undefined ||
      game.hasInitState === undefined ||
      game.hasInitInput === undefined
   ) {
      console.log('we dont have enough data to simulate the game');
      return { game, ctx, canvas };
   }

   const expectedTick = Math.ceil((time() - game.startTime) / (1000 / SIMULATION_RATE));
   const delta = 1 / SIMULATION_RATE;

   // const input = copy(window.currentInput);
   // if (game.ticksSent === undefined) {
   //    game.ticksSent = {};
   // }
   const inputPackages = [];
   const input = copyInput(window.currentInput);
   if (!isSameInput(input, copyInput(window.lastInput))) {
      inputPackages.push({ input, tick: game.tick });
      window.lastInput = copyInput(input);
      if (game.inputs[game.tick] === undefined) {
         game.inputs[game.tick] = {};
      }
      game.inputs[game.tick][window.selfId] = copyInput(input);
      game.renderState.players[selfId].ticksBehind = game.tick - expectedTick;
   }

   game.poll().forEach((data) => {
      if (game.inputs[data.tick] === undefined) {
         game.inputs[data.tick] = {};
      }
      game.inputs[data.tick][data.id] = { ...game.inputs[data.tick][data.id], ...data.input };
      game.renderState.players[data.id].ticksBehind = data.tick - expectedTick;
      game.tick = Math.min(game.tick, data.tick);
   });
   game.pendingInputs = [];

   while (game.tick < expectedTick) {
      // let onCountdown = false;
      // if (game.countdown !== undefined) {
      //    if (game.countdown > 0) {
      //       game.countdown -= delta;
      //       onCountdown = game.countdown > 0;
      //    } else {
      //       game.countdown = 0;
      //       game.countdownAlpha -= delta;
      //    }
      // }
      // // console.log('onCountdown', onCountdown);
      // if (!onCountdown) {
      game.states[game.tick + 1] = simulate(
         game.states[game.tick],
         game.inputs[game.tick] === undefined ? {} : game.inputs[game.tick]
      );
      // if (game.inputs[game.tick + 1] === undefined) {
      //    game.inputs[game.tick + 1] = Object.create(null);
      // }
      // } else {
      //    game.states[game.tick + 1] = copy(game.states[game.tick]);
      //    game.inputs[game.tick + 1] = copy(game.inputs[game.tick]);
      // }
      game.tick++;
   }

   if (inputPackages.length > 0) {
      send({
         inputs: [...inputPackages],
      });
   }

   game.pendingChats.forEach((data) => {
      game.inputs[game.tick][data.id] = { number: data.number, ...game.inputs[game.tick][data.id] };
   });

   game.pendingChats = [];

   // // smoothing

   const realDelta = (window.performance.now() - game.lastTime) / 1000;
   game.lastTime = window.performance.now();

   const lerpTime = Math.min(realDelta * window.smoothing, 1);
   game.renderState.ball.x = lerp(game.renderState.ball.x, game.state().ball.x, lerpTime);
   game.renderState.ball.y = lerp(game.renderState.ball.y, game.state().ball.y, lerpTime);

   for (const id of Object.keys(game.renderState.players)) {
      const player = game.renderState.players[id];
      const realPlayer = copy(game.state().players[id]);
      player.x = lerp(player.x, realPlayer.x, lerpTime);
      player.y = lerp(player.y, realPlayer.y, lerpTime);
      player.shift = realPlayer.shift;
   }

   return { game, ctx, canvas };
};

// function sameInput(input1, input2) {
//    return input1.up === input2.up && input1.down === input2.down;
// }

function lerp(start, end, time) {
   return start * (1 - time) + end * time;
}

function copyInput(input) {
   return { up: input.up, left: input.left, right: input.right, down: input.down, shift: input.shift };
}

function isSameInput(input1, input2) {
   return (
      input1.up === input2.up &&
      input1.left === input2.left &&
      input1.right === input2.right &&
      input1.down === input2.down &&
      input1.shift === input2.shift
   );
}
