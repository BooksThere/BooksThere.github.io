var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
window.addEventListener('load', main);
// var kdfunctions: Array<(e) => void> = new Array();
// var kufunctions: Array<(e) => void> = new Array();
// document.onkeydown = (e) => {
//     for(var i = 0; i < kdfunctions.length; i++) {
// 	kdfunctions[i](e);
//     };
// }
// document.onkeyup = (e) => {
//     for(var i = 0; i < kufunctions.length; i++) {
// 	kufunctions[i](e);
//     };
// }
function main() {
    var game = new Game('main-canvas', 320, 240);
    game.init();
    game.update();
}
// キー入力の逐次処理用
// * アセット管理オブジェクト
var AssetType;
(function (AssetType) {
    AssetType[AssetType["Image"] = 0] = "Image";
})(AssetType || (AssetType = {}));
;
var Asset = (function () {
    function Asset(type, name, src, width, height) {
        this.type = type;
        this.name = name;
        this.src = src;
        this.width = width;
        this.height = height;
    }
    return Asset;
})();
var AssetManager = (function () {
    function AssetManager() {
        this.images = {};
    }
    AssetManager.prototype.loadAssets = function (assets, onComplete) {
        var _this = this;
        var total = assets.length;
        var loadCount = 0;
        var onLoad = function () {
            loadCount++;
            if (loadCount >= total) {
                onComplete();
            }
        };
        assets.forEach(function (asset) {
            switch (asset.type) {
                case AssetType.Image:
                    _this._loadImage(asset, onLoad);
                    break;
            }
        });
    };
    AssetManager.prototype._loadImage = function (asset, onLoad) {
        var image = new Image();
        image.src = asset.src;
        image.width = asset.width;
        image.height = asset.height;
        image.onload = onLoad;
        this.images[asset.name] = image;
    };
    return AssetManager;
})();
// * ゲーム内オブジェクト用クラス
var GameObject = (function () {
    function GameObject(name, pos) {
        this.name = name;
        this.pos = pos;
    }
    GameObject.prototype.setPosition = function (x, y) {
        this.pos.x = x;
        this.pos.y = y;
    };
    GameObject.prototype.update = function () { };
    GameObject.prototype.render = function (ctx) { };
    return GameObject;
})();
// アニメーション(一つ)
var Animation = (function () {
    function Animation(indices, perFrame, totalFrame, isLoop) {
        this.indices = indices;
        this.perFrame = perFrame;
        this.totalFrame = totalFrame;
        this.isLoop = isLoop;
    }
    return Animation;
})();
// * スプライトオブジェクト
// スプライトシートやアニメーション(複数)を管理
var Sprite = (function () {
    function Sprite(game, _imageName, _width, _height, index) {
        this._imageName = _imageName;
        this._width = _width;
        this._height = _height;
        this._image = game.assetManager.images[_imageName];
        if (this._image == undefined) {
            throw new Error("Invalid image name.");
        }
        if (_width <= 0 || _height <= 0
            || this._image.width < _width || this._image.height < _height) {
            throw new Error("Invalid sprite size");
        }
        // 
        this._frameWidth = (this._image.width) / (_width);
        this._frameHeight = (this._image.height) / (_height);
        this._spriteNum = this._frameWidth * this._frameHeight;
        // for initialize
        this._spriteIndex = -1;
        this.setSpriteIndex(index);
        this.flipX = false;
        this.flipY = false;
        this._animations = {};
        this._animationCounter = 0;
        this._playingAnimation = '';
    }
    // 与えられた index に基づいて現在のフレームがスプライトシートのどこに位置するのかを計算
    Sprite.prototype.setSpriteIndex = function (index) {
        if (this._spriteIndex == index) {
            return;
        }
        if (index < 0 || this._spriteNum <= index)
            throw new Error("Invalid frame number.");
        this._spriteIndex = index;
        var x = index % (this._frameWidth);
        ;
        var y = Math.floor(index / (this._frameWidth));
        this._framePos = { x: x * this._width, y: y * this._height };
    };
    Sprite.prototype.addAnimation = function (name, ids, pf, loop) {
        // validation
        ids.forEach(function (index) {
            if (typeof index != 'number')
                throw new Error("Invalid type of index.");
        });
        this._animations[name] = { indices: ids,
            perFrame: pf,
            totalFrame: pf * ids.length,
            isLoop: loop };
    };
    Sprite.prototype.play = function (name) {
        var animation = this._animations[name];
        if (animation == undefined)
            throw new Error("Invalid animation name.");
        this._playingAnimation = name;
    };
    Sprite.prototype.stop = function () {
        this._playingAnimation = null;
        this._animationCounter = 0;
    };
    Sprite.prototype.update = function () {
        var spriteIndex = this._spriteIndex;
        if (this._playingAnimation != null) {
            var animation = this._animations[this._playingAnimation];
            this._animationCounter += 1;
            if (animation.totalFrame <= this._animationCounter) {
                this._animationCounter = 0;
                if (!animation.isLoop) {
                    this._playingAnimation = null;
                    return;
                }
            }
            var index = Math.floor(this._animationCounter / animation.perFrame);
            spriteIndex = animation.indices[index];
        }
        this.setSpriteIndex(spriteIndex);
    };
    Sprite.prototype.draw = function (pos, ctx) {
        ctx.save();
        ctx.beginPath();
        if (this.flipX) {
            ctx.transform(-1, 0, 0, 1, this._width, 0);
        }
        ctx.drawImage(this._image, this._framePos.x, this._framePos.y, this._width, this._height, (this.flipX ? -pos.x : pos.x), pos.y, this._width, this._height);
        ctx.restore();
    };
    return Sprite;
})();
// * スプライト付きオブジェクト
var GameSprite = (function (_super) {
    __extends(GameSprite, _super);
    function GameSprite(name, pos) {
        _super.call(this, name, pos);
        this.offset = { x: 0, y: 0 };
    }
    GameSprite.prototype.setSprite = function (game, imageName, w, h, spriteIndex) {
        this.sprite = new Sprite(game, imageName, w, h, spriteIndex);
    };
    GameSprite.prototype.setOffset = function (ox, oy) {
        this.offset.x = ox;
        this.offset.y = oy;
    };
    GameSprite.prototype.setSize = function (w, h) {
        this.width = w;
        this.height = h;
    };
    GameSprite.prototype.update = function () {
        this.sprite.update();
    };
    GameSprite.prototype.render = function (ctx) {
        this.sprite.draw(this.pos, ctx);
    };
    return GameSprite;
})(GameObject);
// * スプライト管理クラス
// TODO: レイヤ毎に持つか、管理クラスが内部にレイヤを持つ形にするか
var SpriteManager = (function () {
    function SpriteManager() {
        this.objects = {};
        this._objectNum = 0;
    }
    SpriteManager.prototype.addObject = function (obj) {
        obj.id = this._objectNum;
        this.objects[obj.name] = obj;
        this._objectNum += 1;
    };
    SpriteManager.prototype.update = function () {
        for (var key in this.objects) {
            var obj = this.objects[key];
            obj.update();
        }
    };
    SpriteManager.prototype.render = function (ctx) {
        for (var key in this.objects) {
            var obj = this.objects[key];
            obj.render(ctx);
        }
    };
    return SpriteManager;
})();
// * ゲームクラス
// TODO: Game クラスを継承して個々のゲームを作る形にしたい。
var Game = (function () {
    function Game(_canvasName, _screenWidth, _screenHeight) {
        var _this = this;
        this._canvasName = _canvasName;
        this._screenWidth = _screenWidth;
        this._screenHeight = _screenHeight;
        this.INTERVAL = 16;
        this._canvas = document.getElementById(_canvasName);
        this._context = this._canvas.getContext('2d');
        this._canvas.width = _screenWidth;
        this._canvas.height = _screenHeight;
        // キー入力の処理
        this._keys = new Array(256);
        for (var i = 0; i < 256; i++) {
            this._keys[i] = false;
        }
        document.onkeydown = function (e) {
            _this._keys[e.keyCode] = true;
        };
        document.onkeyup = function (e) {
            _this._keys[e.keyCode] = false;
        };
        // コントローラのマウスオーバ
        this._mouseover = { left: false, right: false };
        var cl = document.getElementById('controller-left');
        var cr = document.getElementById('controller-right');
        // left
        cl.onmouseover = function (e) { _this._mouseover.left = true; };
        cl.ontouchstart = function (e) { _this._mouseover.left = true; };
        cl.onmouseout = function (e) { _this._mouseover.left = false; };
        cl.ontouchend = function (e) { _this._mouseover.left = false; };
        // right
        cr.onmouseover = function (e) { _this._mouseover.right = true; };
        cr.ontouchstart = function (e) { _this._mouseover.right = true; };
        cr.onmouseout = function (e) { _this._mouseover.right = false; };
        cr.ontouchend = function (e) { _this._mouseover.right = false; };
        // kdfunctions.push ((e) => {
        //     this._keys[e.keyCode] = true;
        // });
        // kufunctions.push ((e) => {
        //     this._keys[e.keyCode] = false;
        // });
        this.assetManager = new AssetManager();
        this._spriteManager = new SpriteManager();
    }
    Game.prototype.init = function () {
        // キャンバスの設定
        // アセットの読み込み
        this.assetManager.loadAssets([new Asset(AssetType.Image, 'girl', 'assets/image/girl.png', 1600, 80)], function () { });
        // プレイヤの設定
        var player = new GameSprite('player', { x: 0, y: 160 });
        player.setSprite(this, 'girl', 64, 80, 4);
        player.setOffset(4, 12);
        player.setSize(56, 68);
        player.sprite.addAnimation('walk', [2, 1, 0, 1, 2, 3, 4, 3], 6, true);
        player.sprite.addAnimation('swing', [16, 17, 18, 17, 16, 15, 14, 15], 6, true);
        player.sprite.flipX = true;
        this._spriteManager.addObject(player);
    };
    Game.prototype.update = function () {
        var _this = this;
        var player = this._spriteManager.objects['player'];
        var psprite = player.sprite;
        // move
        var KeyA = 65;
        var KeyD = 68;
        var KeyW = 87;
        var d = { x: 0, y: 0 };
        var moveLeft = this._keys[KeyA] || this._mouseover.left;
        var moveRight = this._keys[KeyD] || this._mouseover.right;
        if (moveLeft && moveRight) {
            psprite.stop();
            psprite.setSpriteIndex(2);
        }
        else if (moveLeft) {
            psprite.flipX = false;
            psprite.play('walk');
            d.x = -2;
        }
        else if (moveRight) {
            psprite.flipX = true;
            psprite.play('walk');
            d.x = 2;
        }
        else if (this._keys[KeyW]) {
            psprite.play('swing');
        }
        else {
            psprite.stop();
            psprite.setSpriteIndex(2);
        }
        player.pos.x += d.x;
        player.pos.y += d.y;
        if (player.pos.x + player.offset.x < 0) {
            player.pos.x = -player.offset.x;
        }
        else if (player.pos.x + player.width > this._canvas.width) {
            player.pos.x = this._canvas.width - player.width;
        }
        this._spriteManager.update();
        // rendering
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._spriteManager.render(this._context);
        //
        window.requestAnimationFrame(function () { return _this.update(); });
    };
    return Game;
})();
