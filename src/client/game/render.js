'use strict';

const round = (value) => Math.round(value);
// const { phrases } = require('../../shared/constants.js');

// let phraseText = '';
// for (const [number, text] of Object.entries(phrases)) {
//    phraseText += ` ${number}. ${text} `;
// }

module.exports = function Render({ game, ctx, canvas }) {
   ctx.fillStyle = '#9e9e9e';
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
      drawBall(game, { ctx });
      drawPlayers(game, { ctx });
      // drawPaddles(game, game.countdown <= 0, { ctx });
      // drawScore(Object.values(game.state().scores)[0], Object.values(game.state().scores)[1], { ctx, canvas });
      // if (game.onChat) {
      //    drawChat({ ctx, canvas });
      // }
   }
};

function drawPlayers(game, { ctx }) {
   for (const playerId of Object.keys(game.state().players)) {
      const player = game.state().players[playerId];
      ctx.beginPath();
      ctx.fillStyle = '#2b2b2b';
      ctx.arc(Math.round(player.x), Math.round(player.y), player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = player.team === 'red' ? '#ab0f0f' : '#1d1f80';
      ctx.font = '40px Lexend';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.name, Math.round(player.x), Math.round(player.y - player.radius - 20));
   }
}

function drawBall(game, { ctx }) {
   const ball = game.state().ball;
   ctx.fillStyle = '#ffffff';
   ctx.beginPath();
   ctx.arc(round(ball.x), round(ball.y), ball.radius, 0, Math.PI * 2);
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
