
tools = [{
	name: "Free-Form Select",
	tip: "自由選択",
	description: "絵の一部を選択して、移動、ｺﾋﾟｰ、または編集します。",
	cursor: ["precise", [16, 16], "crosshair"],
	// passive: @TODO,
	
	// The vertices of the polygon
	points: [],
	
	// The boundaries of the polygon
	x_min: +Infinity,
	x_max: -Infinity,
	y_min: +Infinity,
	y_max: -Infinity,
	
	pointerdown: function(){
		var tool = this;
		tool.x_min = pointer.x;
		tool.x_max = pointer.x+1;
		tool.y_min = pointer.y;
		tool.y_max = pointer.y+1;
		tool.points = [];
		
		// End prior selection, drawing it to the canvas
		deselect();
		// Checkpoint so we can roll back inverty brush
		// XXX: Shouldn't use the undo stack for this at all!
		// TODO: Create an OnCanvasObject for the inverty brush, and make selection a passive action
		undoable();

		// The inverty brush is continuous in space which means
		// paint(ctx, x, y) will be called for each pixel the pointer moves
		// and we only need to record individual pointer events to make the polygon
		var onpointermove = function(e){
			var pointer = e2c(e);
			// Constrain the pointer to the canvas
			pointer.x = Math.min(canvas.width, pointer.x);
			pointer.x = Math.max(0, pointer.x);
			pointer.y = Math.min(canvas.height, pointer.y);
			pointer.y = Math.max(0, pointer.y);
			// Add the point
			tool.points.push(pointer);
			// Update the boundaries of the polygon
			tool.x_min = Math.min(pointer.x, tool.x_min);
			tool.x_max = Math.max(pointer.x, tool.x_max);
			tool.y_min = Math.min(pointer.y, tool.y_min);
			tool.y_max = Math.max(pointer.y, tool.y_max);
		};
		$G.on("pointermove", onpointermove);
		$G.one("pointerup", function(){
			$G.off("pointermove", onpointermove);
		});
	},
	continuous: "space",
	paint: function(ctx, x, y){
		
		// Constrain the inverty paint brush position to the canvas
		x = Math.min(canvas.width, x);
		x = Math.max(0, x);
		y = Math.min(canvas.height, y);
		y = Math.max(0, y);
		
		// Find the dimensions on the canvas of the tiny square to invert
		var inverty_size = 2;
		var rect_x = ~~(x - inverty_size/2);
		var rect_y = ~~(y - inverty_size/2);
		var rect_w = inverty_size;
		var rect_h = inverty_size;
		
		var ctx_src = undos[undos.length-1].getContext("2d");//psh
		
		// Make two tiny ImageData objects,
		var id_dest = ctx.getImageData(rect_x, rect_y, rect_w, rect_h);
		var id_src = ctx_src.getImageData(rect_x, rect_y, rect_w, rect_h);
		
		for(var i=0, l=id_dest.data.length; i<l; i+=4){
			id_dest.data[i+0] = 255 - id_src.data[i+0];
			id_dest.data[i+1] = 255 - id_src.data[i+1];
			id_dest.data[i+2] = 255 - id_src.data[i+2];
			id_dest.data[i+3] = 255;
			// @TODO maybe: invert based on id_src.data[i+3] and the background
		}
		
		ctx.putImageData(id_dest, rect_x, rect_y);
		
	},
	pointerup: function(){
		// Revert the inverty brush paint
		ctx.copy(undos[undos.length-1]);
		
		// Cut out the polygon
		var cutout = cut_polygon(
			this.points,
			this.x_min,
			this.y_min,
			this.x_max,
			this.y_max
		);
		
		// Make the selection
		selection = new Selection(
			this.x_min,
			this.y_min,
			this.x_max - this.x_min,
			this.y_max - this.y_min
		);
		selection.instantiate(cutout);
		selection.cut_out_background();
	},
	$options: $choose_transparency
}, {
	name: "Select",
	tip: "選択",
	description: "絵の一部を四角形で選択して、移動、ｺﾋﾟｰ、または編集します。",
	cursor: ["precise", [16, 16], "crosshair"],
	passive: true,
	drag_start_x: 0,
	drag_start_y: 0,
	pointerdown: function(){
		this.drag_start_x = pointer.x;
		this.drag_start_y = pointer.y;
		if(selection){
			selection.draw();
			selection.destroy();
			selection = null;
		}
		var pointer_has_moved = false;
		$G.one("pointermove", function(){
			pointer_has_moved = true;
		});
		$G.one("pointerup", function(){
			if(!pointer_has_moved && selection){
				selection.draw();//?
				selection.destroy();
				selection = null;
			}
		});
		selection = new Selection(pointer.x, pointer.y, 1, 1);
	},
	paint: function(){
		if(!selection){ return; }
		var x1 = Math.max(0, Math.min(this.drag_start_x, pointer.x));
		var y1 = Math.max(0, Math.min(this.drag_start_y, pointer.y));
		var x2 = Math.min(canvas.width, Math.max(this.drag_start_x, pointer.x));
		var y2 = Math.min(canvas.height, Math.max(this.drag_start_y, pointer.y));
		selection.x = x1;
		selection.y = y1;
		selection.width = Math.max(1, x2 - x1);
		selection.height = Math.max(1, y2 - y1);
		selection.position();
	},
	pointerup: function(){
		if(!selection){ return; }
		
		if(ctrl){
			selection.crop();
			selection.destroy();
			selection = null;
		}else{
			selection.instantiate();
		}
	},
	cancel: function(){
		if(!selection){return;}
		selection.destroy();
		selection = null;
	},
	$options: $choose_transparency
}, {
	name: "Eraser/Color Eraser",
	tip: "消しｺﾞﾑ/ｶﾗｰ消しｺﾞﾑ",
	description: "選択された消しｺﾞﾑで、絵の一部を消します。",
	cursor: ["precise", [16, 16], "crosshair"],
	// @TODO: draw square on canvas as cursor
	continuous: "space",
	paint: function(ctx, x, y){
		
		var rect_x = ~~(x - eraser_size/2);
		var rect_y = ~~(y - eraser_size/2);
		var rect_w = eraser_size;
		var rect_h = eraser_size;
		
		if(button === 0){
			// Eraser
			if(transparency){
				ctx.clearRect(rect_x, rect_y, rect_w, rect_h);
			}else{
				ctx.fillStyle = colors.background;
				ctx.fillRect(rect_x, rect_y, rect_w, rect_h);
			}
		}else{
			// Color Eraser
			// Right click with the eraser to selectively replace
			// the selected foreground color with the selected background color
			
			var fg_rgba = get_rgba_from_color(colors.foreground);
			var bg_rgba = get_rgba_from_color(colors.background);
			
			var id = ctx.getImageData(rect_x, rect_y, rect_w, rect_h);
			
			for(var i=0, l=id.data.length; i<l; i+=4){
				if(
					id.data[i+0] === fg_rgba[0] &&
					id.data[i+1] === fg_rgba[1] &&
					id.data[i+2] === fg_rgba[2] &&
					id.data[i+3] === fg_rgba[3]
				){
					id.data[i+0] = bg_rgba[0];
					id.data[i+1] = bg_rgba[1];
					id.data[i+2] = bg_rgba[2];
					id.data[i+3] = bg_rgba[3];
				}
			}
			
			ctx.putImageData(id, rect_x, rect_y);
		}
	},
	$options: $choose_eraser_size
}, {
	name: "Fill With Color",
	tip: "塗りつぶし",
	description: "現在の色で領域を塗りつぶします。",
	cursor: ["fill-bucket", [8, 22], "crosshair"],
	pointerdown: function(ctx, x, y){
		
		// Get the rgba values of the selected fill color
		var rgba = get_rgba_from_color(fill_color);
		
		// Perform the fill operation
		draw_fill(ctx, x, y, rgba[0], rgba[1], rgba[2], rgba[3]);
		
	}
}, {
	name: "Pick Color",
	tip: "色の選択",
	description: "絵の中から、色を選択します。",
	cursor: ["eye-dropper", [9, 22], "crosshair"],
	deselect: true,
	passive: true,
	
	current_color: "",
	display_current_color: function(){
		this.$options.css({
			background: this.current_color
		});
	},
	pointerdown: function(){
		var _this = this;
		$G.one("pointerup", function(){
			_this.$options.css({
				background: ""
			});
		});
	},
	paint: function(ctx, x, y){
		if(x >= 0 && y >= 0 && x < canvas.width && y < canvas.height){
			var id = ctx.getImageData(~~x, ~~y, 1, 1);
			var r = id.data[0];
			var g = id.data[1];
			var b = id.data[2];
			var a = id.data[3];
			this.current_color = "rgba("+r+","+g+","+b+","+a/255+")";
		}else{
			this.current_color = "white";
		}
		this.display_current_color();
	},
	pointerup: function(){
		colors[fill_color_k] = this.current_color;
		$G.trigger("option-changed");
	},
	$options: $(E("div"))
}, {
	name: "Magnifier",
	tip: "拡大と縮小",
	description: "拡大または縮小します。",
	cursor: ["magnifier", [16, 16], "zoom-in"],
	// @TODO: use zoom-in/zoom-out as default,
	// even though the custom cursor image is less descriptive
	deselect: true,
	passive: true,
	// @TODO: choose and preview viewport with rectangular cursor
	pointerdown: function(){
		if(magnification > 1){
			reset_magnification();
		}else{
			set_magnification(this.$options.enlarged_magnification);
		}
	},
	$options: $choose_magnification
}, {
	name: "Pencil",
	tip: "鉛筆",
	description: "1ﾋﾟｸｾﾙ幅の線を引きます。",
	cursor: ["pencil", [13, 23], "crosshair"],
	continuous: "space",
	stroke_only: true,
	paint: function(ctx, x, y){
		ctx.fillRect(x, y, 1, 1);
	}
}, {
	name: "Brush",
	tip: "ﾌﾞﾗｼ",
	description: "選択された形や幅のﾌﾞﾗｼで描きます。",
	cursor: ["precise-dotted", [16, 16], "crosshair"],
	continuous: "space",
	rendered_color: "",
	rendered_size: 0,
	rendered_shape: "",
	paint: function(ctx, x, y){
		var csz = brush_size * (brush_shape === "circle" ? 2.1 : 1);
		if(
			this.rendered_shape !== brush_shape ||
			this.rendered_color !== stroke_color ||
			this.rendered_size !== brush_size
		){
			brush_canvas.width = csz;
			brush_canvas.height = csz;

			brush_ctx.fillStyle = brush_ctx.strokeStyle = stroke_color;
			render_brush(brush_ctx, brush_shape, brush_size);
			
			this.rendered_color = stroke_color;
			this.rendered_size = brush_size;
			this.rendered_shape = brush_shape;
		}
		ctx.drawImage(brush_canvas, ~~(x-csz/2), ~~(y-csz/2));
	},
	$options: $choose_brush
}, {
	name: "Airbrush",
	tip: "ｴｱﾌﾞﾗｼ",
	description: "選択されたｻｲｽﾞのｴｱﾌﾞﾗｼで描きます。",
	cursor: ["airbrush", [7, 22], "crosshair"],
	continuous: "time",
	paint: function(ctx, x, y){
		var r = airbrush_size / 2;
		for(var i = 0; i < 6 + r/5; i++){
			var rx = (Math.random()*2-1) * r;
			var ry = (Math.random()*2-1) * r;
			var d = rx*rx + ry*ry;
			if(d <= r * r){
				ctx.fillRect(x + ~~rx, y + ~~ry, 1, 1);
			}
		}
	},
	$options: $choose_airbrush_size
}, {
	name: "Text",
	tip: "ﾃｷｽﾄ",
	description: "絵の中にﾃｷｽﾄを貼り付けます。",
	cursor: ["precise", [16, 16], "crosshair"],
	passive: true,
	activate: function(){
		setTimeout(FontDetective.preload, 10);
	},
	drag_start_x: 0,
	drag_start_y: 0,
	pointerdown: function(){
		this.drag_start_x = pointer.x;
		this.drag_start_y = pointer.y;
		if(textbox){
			textbox.draw();
			textbox.destroy();
		}
		var pointer_has_moved = false;
		$G.one("pointermove", function(){
			pointer_has_moved = true;
		});
		$G.one("pointerup", function(){
			if(!pointer_has_moved && textbox){
				textbox.draw();
				textbox.destroy();
				textbox = null;
			}
		});
		textbox = new TextBox(pointer.x, pointer.y, 1, 1);
	},
	paint: function(){
		if(!textbox){ return; }
		var x1 = Math.max(0, Math.min(this.drag_start_x, pointer.x));
		var y1 = Math.max(0, Math.min(this.drag_start_y, pointer.y));
		var x2 = Math.min(canvas.width, Math.max(this.drag_start_x, pointer.x));
		var y2 = Math.min(canvas.height, Math.max(this.drag_start_y, pointer.y));
		textbox.x = x1;
		textbox.y = y1;
		textbox.width = Math.max(1, x2 - x1);
		textbox.height = Math.max(1, y2 - y1);
		textbox.position();
	},
	pointerup: function(){
		if(!textbox){ return; }
		textbox.instantiate();
	},
	cancel: function(){
		if(!textbox){ return; }
		textbox.destroy();
		textbox = null;
	},
	$options: $choose_transparency
}, {
	name: "Line",
	tip: "直線",
	description: "選択された太さの線で、直線を引きます。",
	cursor: ["precise", [16, 16], "crosshair"],
	stroke_only: true,
	shape: function(ctx, x, y, w, h){
		draw_line(ctx, x, y, x+w, y+h, stroke_size);
	},
	$options: $choose_stroke_size
}, {
	name: "Curve",
	tip: "曲線",
	description: "選択された太さの線で、曲線を引きます。",
	cursor: ["precise", [16, 16], "crosshair"],
	stroke_only: true,
	points: [],
	passive: function(){
		// Actions are passive if you've already started using the tool,
		// but the first action should be undoable / cancelable
		return this.points.length > 0;
	},
	pointerup: function(ctx, x, y){
		if(this.points.length >= 4){
			this.points = [];
		}
	},
	pointerdown: function(ctx, x, y){
		if(this.points.length < 1){
			// This would be so much better in CoffeeScript
			var thine = this;
			undoable(function(){
				thine.points.push({x: x, y: y});
				// second point so first action draws a line
				thine.points.push({x: x, y: y});
			});
		}else{
			this.points.push({x: x, y: y});
		}
	},
	paint: function(ctx, x, y){
		if(this.points.length < 1){ return; }
		
		var i = this.points.length - 1;
		this.points[i].x = x;
		this.points[i].y = y;
		
		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);
		if(this.points.length === 4){
			ctx.bezierCurveTo(
				this.points[2].x, this.points[2].y,
				this.points[3].x, this.points[3].y,
				this.points[1].x, this.points[1].y
			);
		}else if(this.points.length === 3){
			ctx.quadraticCurveTo(
				this.points[2].x, this.points[2].y,
				this.points[1].x, this.points[1].y
			);
		}else{
			ctx.lineTo(
				this.points[1].x, this.points[1].y
			);
		}
		ctx.lineCap = "round";
		ctx.stroke();
		ctx.lineCap = "butt";
	},
	cancel: function(){
		this.points = [];
	},
	end: function(){
		this.points = [];
	},
	shape: function(){true},
	$options: $choose_stroke_size
}, {
	name: "Rectangle",
	tip: "四角形",
	description: "選択された塗りつぶし形式で、四角形を描きます。",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: function(ctx, x, y, w, h){
		if(this.$options.fill){
			ctx.fillRect(x, y, w, h);
		}
		if(this.$options.stroke){
			// FIXME: can draw 1x2 or 2x1 pixels of a rectangle with a stroke of 1px (the default)
			// which doesn't get drawn at full opacity
			// or more generally, a 0-width or 0-height rectangle gives
			// non-full-opacity pixels at either side of the resulting line drawn
			if((stroke_size % 2) === 1){
				ctx.strokeRect(x-0.5, y-0.5, w, h);
			}else{
				ctx.strokeRect(x, y, w, h);
			}
		}
	},
	$options: $ChooseShapeStyle()
}, {
	name: "Polygon",
	tip: "多角形",
	description: "選択された塗りつぶし形式で、多角形を描きます。",
	cursor: ["precise", [16, 16], "crosshair"],
	
	// Record the last click for double-clicking
	// A double click happens on pointerdown of a second click
	// (within a cylindrical volume in 2d space + 1d time)
	last_click_pointerdown: {x: -Infinity, y: -Infinity, time: -Infinity},
	last_click_pointerup: {x: -Infinity, y: -Infinity, time: -Infinity},
	
	// The vertices of the polygon
	points: [],
	
	// The boundaries of the polygon
	x_min: +Infinity,
	x_max: -Infinity,
	y_min: +Infinity,
	y_max: -Infinity,
	
	passive: function(){
		// actions are passive if you've already started using the tool
		// but the first action should be undoable
		return this.points.length > 0;
		// In other words, it's supposed to be one undoable action
	},
	pointerup: function(ctx, x, y){
		if(this.points.length < 1){ return; }
		
		var i = this.points.length - 1;
		this.points[i].x = x;
		this.points[i].y = y;
		var dx = this.points[i].x - this.points[0].x;
		var dy = this.points[i].y - this.points[0].y;
		var d = Math.sqrt(dx*dx + dy*dy);
		if(d < stroke_size * 5.1010101){ // arbitrary 101
			this.complete(ctx, x, y);
		}
		
		this.last_click_pointerup = {x: x, y: y, time: +(new Date)};
	},
	pointerdown: function(ctx, x, y){
		var tool = this;
		
		if(tool.points.length < 1){
			tool.x_min = x;
			tool.x_max = x+1;
			tool.y_min = y;
			tool.y_max = y+1;
			tool.points = [];
			
			// @TODO: stop needing this:
			tool.canvas_base = canvas;
			
			undoable(function(){
				// @TODO: stop needing this:
				tool.canvas_base = undos[undos.length-1];
				
				// Add the first point of the polygon
				tool.points.push({x: x, y: y});
				// Add a second point so first action draws a line
				tool.points.push({x: x, y: y});
			});
		}else{
			var lx = tool.last_click_pointerdown.x;
			var ly = tool.last_click_pointerdown.y;
			var lt = tool.last_click_pointerdown.time;
			var dx = x - lx;
			var dy = y - ly;
			var dt = +(new Date) - lt;
			var d = Math.sqrt(dx*dx + dy*dy);
			if(d < 4.1010101 && dt < 250){ // arbitrary 101
				tool.complete(ctx, x, y);
				// Release the pointer to prevent tool.paint()
				// being called and clearing the canvas
				$canvas.trigger("pointerup");
			}else{
				// Add the point
				tool.points.push({x: x, y: y});
				// Update the boundaries of the polygon
				// @TODO: this boundary stuff in less places (DRY)
				tool.x_min = Math.min(x, tool.x_min);
				tool.x_max = Math.max(x, tool.x_max);
				tool.y_min = Math.min(y, tool.y_min);
				tool.y_max = Math.max(y, tool.y_max);
			}
		}
		tool.last_click_pointerdown = {x: x, y: y, time: +new Date};
	},
	paint: function(ctx, x, y){
		if(this.points.length < 1){ return; }
		
		// Clear the canvas to the previous image to get
		// rid of lines drawn while constructing the shape
		// @TODO: stop needing this
		ctx.copy(this.canvas_base);
		
		var i = this.points.length - 1;
		this.points[i].x = x;
		this.points[i].y = y;
		
		ctx.fillStyle = stroke_color;
		for(var i=0, j=1; j<this.points.length; i++, j++){
			draw_line(ctx,
				this.points[i].x, this.points[i].y,
				this.points[j].x, this.points[j].y,
				stroke_size
			);
		}
	},
	complete: function(ctx, x, y){
		if(this.points.length < 1){ return; }
		
		// Clear the canvas to the previous image to get
		// rid of lines drawn while constructing the shape
		// @TODO: stop needing this
		ctx.copy(this.canvas_base);
		
		// Draw an antialiased polygon
		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);
		for(var i=1; i<this.points.length; i++){
			ctx.lineTo(this.points[i].x, this.points[i].y);
		}
		ctx.lineTo(this.points[0].x, this.points[0].y);
		ctx.closePath();
		
		ctx.lineWidth = stroke_size;
		ctx.lineJoin = "bevel";
		if(this.$options.fill){
			ctx.fillStyle = fill_color;
			ctx.fill();
		}
		if(this.$options.stroke){
			ctx.strokeStyle = stroke_color;
			ctx.stroke();
		}
		
		/*
		if(this.$options.fill){
			// Make a solid-colored canvas
			var colored_canvas = new Canvas(canvas.width, canvas.height);
			colored_canvas.ctx.fillStyle = fill_color;
			colored_canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);
			
			for(var i=0; i<this.points.length; i++){
				// Update the boundaries of the polygon
				// @TODO: this boundary stuff in less places (DRY)
				this.x_min = Math.min(this.points[i].x, this.x_min);
				this.x_max = Math.max(this.points[i].x, this.x_max);
				this.y_min = Math.min(this.points[i].y, this.y_min);
				this.y_max = Math.max(this.points[i].y, this.y_max);
			}
			
			// Cut a colored polygon out of the solid-colored canvas
			var colored_polygon = cut_polygon(
				this.points,
				this.x_min,
				this.y_min,
				this.x_max,
				this.y_max,
				colored_canvas,
				0.25
			);
			
			// Draw the colored polygon to the canvas
			ctx.drawImage(colored_polygon, this.x_min, this.y_min);
			
		}
		if(this.$options.stroke){
			ctx.fillStyle = stroke_color;
			for(var i=0, j=1; j<this.points.length; i++, j++){
				draw_line(ctx,
					this.points[i].x, this.points[i].y,
					this.points[j].x, this.points[j].y,
					stroke_size
				);
			}
			j = 0;
			i = this.points.length - 1;
			draw_line(ctx,
				this.points[i].x, this.points[i].y,
				this.points[j].x, this.points[j].y,
				stroke_size
			);
		}
		*/
		
		this.reset();
	},
	cancel: function(){
		this.reset();
	},
	end: function(){
		this.reset();
	},
	reset: function(){
		this.points = [];
		this.last_click_pointerdown = {x: -Infinity, y: -Infinity, time: -Infinity};
		this.last_click_pointerup = {x: -Infinity, y: -Infinity, time: -Infinity};
	},
	shape_colors: true,
	$options: $ChooseShapeStyle()
}, {
	name: "Ellipse",
	tip: "楕円",
	description: "選択された塗りつぶし形式で、楕円を描きます。",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: function(ctx, x, y, w, h){
		draw_ellipse(ctx, x, y, w, h, this.$options.stroke, this.$options.fill);
	},
	$options: $ChooseShapeStyle()
}, {
	name: "Rounded Rectangle",
	tip: "角丸四角形",
	description: "選択された塗りつぶし形式で、角の丸い四角形を描きます。",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: function(ctx, x, y, w, h){
		if(w < 0){ x += w; w = -w; }
		if(h < 0){ y += h; h = -h; }
		var radius = Math.min(7, w/2, h/2);
		
		draw_rounded_rectangle(ctx, x, y, w, h, radius);
	},
	$options: $ChooseShapeStyle()
}];
