'use strict';

const round = (value) => Math.round(value);
// const {  } = require('../../shared/constants.js');

// let phraseText = '';
// for (const [number, text] of Object.entries(phrases)) {
//    phraseText += ` ${number}. ${text} `;
// }

module.exports = function Render({ game, ctx, canvas }) {
   ctx.fillStyle = '#045200';
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   if (game === undefined) return;
   // if (game.countdown !== undefined || game.countdownAlpha + 0.5 <= 0) {
   //    ctx.fillStyle = 'white';
   //    ctx.font = `65px Lexend`;
   //    ctx.textAlign = 'center';
   //    ctx.textBaseline = 'middle';
   //    ctx.globalAlpha = Math.max(0, game.countdownAlpha + 0.5);
   //    ctx.fillText(
   //       `${game.countdown <= 0 ? 'GO!' : window.debugMode ? game.countdown.toFixed(2) : Math.ceil(game.countdown)}`,
   //       canvas.width / 2,
   //       canvas.height / 4
   //    );
   //    // drawVs({
   //    //    ctx,
   //    //    canvas,
   //    //    name1: Object.values(game.state().paddles).find((paddle) => paddle.x < canvas.width / 2)?.name,
   //    //    name2: Object.values(game.state().paddles).find((paddle) => paddle.x > canvas.width / 2)?.name,
   //    //    game,
   //    // });
   //    ctx.globalAlpha = 1;
   // }
   if (game.state() !== undefined) {
      drawBound(game, { ctx });
      drawGoals(game, { ctx });
      drawBall(game, { ctx });
      drawPlayers(game, { ctx });
      // drawPaddles(game, game.countdown <= 0, { ctx });
      // drawScore(Object.values(game.state().scores)[0], Object.values(game.state().scores)[1], { ctx, canvas });
      // if (game.onChat) {
      //    drawChat({ ctx, canvas });
      // }
   }
};

function offset(x, y, game, canvas) {
   const player = game.renderState.players[selfId];
   return {
      x: Math.round(x - player.x + canvas.width / 2),
      y: Math.round(y - player.y + canvas.height / 2),
   };
}

function drawGoals(game, { ctx }) {
   for (const goal of Object.values(game.state().goals)) {
      ctx.fillStyle = goal.team === 'red' ? '#eb2d2d' : '#4157ba';
      const pos = offset(goal.x, goal.y, game, ctx.canvas);
      ctx.fillRect(pos.x, pos.y, goal.width, goal.height);
   }
}

function drawBound(game, { ctx }) {
   const { x, y, width, height } = game.state().bound;
   ctx.fillStyle = '#3c9137';
   const pos = offset(x, y, game, ctx.canvas);
   ctx.fillRect(pos.x, pos.y, width, height);
   ctx.lineWidth = 5;
   ctx.strokeStyle = '#145e10';
   const amount = 2;
   for (let y = 0; y < height; y += height / amount) {
      for (let x = 0; x < width; x += width / amount) {
         const pos = offset(x, y, game, ctx.canvas);
         ctx.strokeRect(pos.x, pos.y, width / amount, height / amount);
      }
   }
}

function drawPlayers(game, { ctx }) {
   for (const playerId of Object.keys(game.renderState.players)) {
      const player = game.renderState.players[playerId];
      ctx.beginPath();
      ctx.fillStyle = player.team === 'red' ? '#ab0f0f' : '#1d1f80';
      const pos = offset(player.x, player.y, game, ctx.canvas);
      ctx.arc(Math.round(pos.x), Math.round(pos.y), player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.font = '40px Lexend';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.name, Math.round(pos.x), Math.round(pos.y - player.radius - 20));
      if (window.debugMode) {
         ctx.fillStyle = 'white';
         ctx.fillText(player.ticksBehind, Math.round(pos.x), Math.round(pos.y));
      }
   }
}

function drawBall(game, { ctx }) {
   const ball = game.renderState.ball;
   const pos = offset(ball.x, ball.y, game, ctx.canvas);
   ctx.fillStyle = '#ffffff';
   ctx.beginPath();
   ctx.arc(round(pos.x), round(pos.y), ball.radius, 0, Math.PI * 2);
   ctx.fill();
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
   if (w < 2 * r) r = w / 2;
   if (h < 2 * r) r = h / 2;
   this.beginPath();
   this.moveTo(x + r, y);
   this.arcTo(x + w, y, x + w, y + h, r);
   this.arcTo(x + w, y + h, x, y + h, r);
   this.arcTo(x, y + h, x, y, r);
   this.arcTo(x, y, x + w, y, r);
   this.closePath();
   return this;
};
CanvasRenderingContext2D.prototype.fillStroke = function () {
   this.fill();
   this.stroke();
};
