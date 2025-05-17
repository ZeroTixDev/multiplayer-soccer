'use strict';

const round = (value) => Math.round(value);
// const {  } = require('../../shared/constants.js');

// let phraseText = '';
// for (const [number, text] of Object.entries(phrases)) {
//    phraseText += ` ${number}. ${text} `;
// }

module.exports = function Render({ game, ctx, canvas }) {
   ctx.fillStyle = 'black';//'#045200';
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
      ctx.strokeStyle = goal.team === 'red' ? '#eb2d2d' : '#4157ba';
      const pos = offset(goal.x, goal.y, game, ctx.canvas);
      if (goal.team === 'red') {
         ctx.lineWidth = 8;
         ctx.beginPath();
         ctx.lineTo(pos.x+goal.width, pos.y);
         ctx.lineTo(pos.x, pos.y);
         ctx.lineTo(pos.x, pos.y+goal.height);
         ctx.lineTo(pos.x+goal.width, pos.y + goal.height);
         ctx.stroke();
      } else {
         ctx.lineWidth = 8;
         ctx.beginPath();
         ctx.lineTo(pos.x, pos.y);
         ctx.lineTo(pos.x+goal.width, pos.y);
         ctx.lineTo(pos.x+goal.width, pos.y+goal.height);
         ctx.lineTo(pos.x, pos.y + goal.height);
         ctx.stroke();
      }
      ctx.fillStyle = ctx.strokeStyle;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(pos.x, pos.y, goal.width, goal.height);
      ctx.globalAlpha = 1;
   }
}

function drawBound(game, { ctx }) {
   const { x, y, width, height } = game.state().bound;
   ctx.fillStyle = 'rgb(20, 20, 20)'//'#3c9137';
   const pos = offset(x, y, game, ctx.canvas);
   ctx.fillRect(pos.x, pos.y, width, height);
   ctx.lineWidth = 5;
   ctx.strokeStyle = 'rgb(200, 200, 200)';//'#145e10';
   let amount = 2;
   ctx.globalAlpha = 0.5;
   for (let y = 0; y < height; y += height / amount) {
      for (let x = 0; x < width; x += width / amount) {
         const pos = offset(x, y, game, ctx.canvas);
         ctx.strokeRect(pos.x, pos.y, width / amount, height / amount);
      }
   }
   amount = 10;
   // ctx.globalAlpha = 0.5;
   // for (let y = 0; y < height; y += height / amount) {
   //    for (let x = 0; x < width; x += width / amount) {
   //       const pos = offset(x, y, game, ctx.canvas);
   //       ctx.strokeRect(pos.x, pos.y, width / amount, height / amount);
   //    }
   // }
   ctx.globalAlpha = 1;
}

function drawPlayers(game, { ctx }) {
   for (const playerId of Object.keys(game.renderState.players)) {
      const player = game.renderState.players[playerId];
      ctx.beginPath();
      ctx.strokeStyle = player.team === 'red' ? '#ab0f0f' : '#1d1f80';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 8;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.strokeStyle;
      const pos = offset(player.x, player.y, game, ctx.canvas);
      ctx.arc(Math.round(pos.x), Math.round(pos.y), player.radius-ctx.lineWidth/2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';////''black';
      ctx.font = '40px Lexend';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.name, Math.round(pos.x), Math.round(pos.y - player.radius - 25));
      if (window.debugMode) {
         ctx.fillStyle = 'white';
         ctx.fillText(player.ticksBehind, Math.round(pos.x), Math.round(pos.y));
      }
   }
}

function drawBall(game, { ctx }) {
   const ball = game.renderState.ball;
   const pos = offset(ball.x, ball.y, game, ctx.canvas);
   ctx.strokeStyle = '#ffffff';
   ctx.fillStyle = ctx.strokeStyle;
   ctx.shadowBlur = 12;
   ctx.shadowColor = ctx.strokeStyle;
   ctx.lineWidth = 12;
   ctx.beginPath();
   ctx.arc(round(pos.x), round(pos.y), ball.radius-ctx.lineWidth/2, 0, Math.PI * 2);
   ctx.stroke();
   ctx.fill();
   ctx.shadowBlur = 0;
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
