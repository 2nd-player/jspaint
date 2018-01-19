//from W95 Japanese version
var menus = {
	"ﾌｧｲﾙ(&F)": [
		{
			item: "新規(&N)",
			shortcut: "Ctrl+N",
			action: file_new,
			description: "新しいﾌｧｲﾙを作成します。",
		},
		{
			item: "開く(&O)...",
			shortcut: "Ctrl+O",
			action: file_open,
			description: "既存のﾌｧｲﾙを開きます。",
		},
		{
			item: "&Load From URL",
			// shortcut: "Ctrl+L",
			action: file_load_from_url,
			description: "Opens an image from the web.",
		},
		{
			item: "上書き保存(&S)",
			shortcut: "Ctrl+S",
			action: file_save,
			description: "現在のﾌｧｲﾙを保存します。",
		},
		{
			item: "名前を付けて保存(&A)",
			shortcut: "Ctrl+Shift+S",
			//shortcut: "",
			action: file_save_as,
			description: "現在のﾌｧｲﾙを新しい名前で保存します。",
		},
		$MenuBar.DIVIDER,
		{
			item: "印刷ﾌﾟﾚﾋﾞｭｰ(&V)",
			action: function(){
				print();
			},
			description: "印刷ｵﾌﾟｼｮﾝを設定し、現在のﾌｧｲﾙを印刷します。",
			//description: "ﾍﾟｰｼﾞ全体を表示します。",
		},
		{
			item: "ﾍﾟｰｼﾞ設定(&U)",
			action: function(){
				print();
			},
			description: "印刷ｵﾌﾟｼｮﾝを設定し、現在のﾌｧｲﾙを印刷します。",
			//description: "ﾍﾟｰｼﾞ ﾚｲｱｳﾄの設定を変更します。",
		},
		{
			item: "印刷(&P)",
			shortcut: "Ctrl+P",
			action: function(){
				print();
			},
			description: "印刷ｵﾌﾟｼｮﾝを設定し、現在のﾌｧｲﾙを印刷します。",
		},
		$MenuBar.DIVIDER,
		{
			item: "壁紙に設定(並べて表示) (&W)",
			action: set_as_wallpaper_tiled,
			description: "このﾋﾞｯﾄﾏｯﾌﾟを壁紙として使用し、並べて表示します。",
		},
		{
			item: "壁紙に設定(中央に表示) (&L)",
			action: set_as_wallpaper_centered,
			description: "このﾋﾞｯﾄﾏｯﾌﾟを壁紙として使用し、中央に表示します。",
		},
		$MenuBar.DIVIDER,
		{
			item: "Manage Storage",
			action: manage_storage,
			description: "Manages storage of previously created or opened pictures.",
		},
		$MenuBar.DIVIDER,
		{
			item: "最新のﾌｧｲﾙ",
			enabled: false, // @TODO for chrome app
			description: "",
		},
		$MenuBar.DIVIDER,
		{
			item: "ﾍﾟｲﾝﾄの終了(&X)",
			shortcut: "Alt+F4",
			action: function(){
				close();
			},
			description: "ﾍﾟｲﾝﾄを終了します。",
		}
	],
	"編集(&E)": [
		{
			item: "元に戻す(&U)",
			shortcut: "Ctrl+Z",
			enabled: function(){
				return undos.length >= 1;
			},
			action: undo,
			description: "直前に行った操作を取り消します。",
		},
		{
			item: "やり直し(&R)",
			shortcut: "F4",
			enabled: function(){
				return redos.length >= 1;
			},
			action: redo,
			description: "直前に行った操作をやり直します。",
		},
		$MenuBar.DIVIDER,
		{
			item: "切り取り(&T)",
			shortcut: "Ctrl+X",
			enabled: function(){
				// @TODO disable if no selection (image or text)
				return (typeof chrome !== "undefined") && chrome.permissions;
			},
			action: function(){
				document.execCommand("cut");
			},
			description: "選択範囲を切り取ってｸﾘｯﾌﾟﾎﾞｰﾄﾞに移動します。",
		},
		{
			item: "ｺﾋﾟｰ(&C)",
			shortcut: "Ctrl+C",
			enabled: function(){
				// @TODO disable if no selection (image or text)
				return (typeof chrome !== "undefined") && chrome.permissions;
			},
			action: function(){
				document.execCommand("copy");
			},
			description: "選択範囲をｸﾘｯﾌﾟﾎﾞｰﾄﾞにｺﾋﾟｰします。",
		},
		{
			item: "貼り付け(&P)",
			shortcut: "Ctrl+V",
			enabled: function(){
				return (typeof chrome !== "undefined") && chrome.permissions;
			},
			action: function(){
				document.execCommand("paste");
			},
			description: "ｸﾘｯﾌﾟﾎﾞｰﾄﾞの内容を挿入します。",
		},
		{
			item: "選択範囲のｸﾘｱ(&L)",
			shortcut: "Del",
			enabled: function(){ return !!selection; },
			action: delete_selection,
			description: "選択範囲を削除します。",
		},
		{
			item: "すべて選択(&A)",
			shortcut: "Ctrl+A",
			action: select_all,
			description: "すべての範囲を選択します。",
		},
		$MenuBar.DIVIDER,
		{
			item: "ﾌｧｲﾙへｺﾋﾟｰ(&O)...",
			enabled: function(){ return !!selection; },
			action: save_selection_to_file,
			description: "選択範囲をﾌｧｲﾙにｺﾋﾟｰします。",
		},
		{
			item: "ﾌｧｲﾙから貼り付け&(F)...",
			action: paste_from_file_select_dialog,
			description: "選択範囲にﾌｧｲﾙを貼り付けます。",
		}
	],
	"表示(&V)": [
		{
			item: "ﾂｰﾙ ﾎﾞｯｸｽ(&T)",
			shortcut: "Ctrl+T",
			checkbox: {
				toggle: function(){
					$toolbox.toggle();
				},
				check: function(){
					return $toolbox.is(":visible");
				},
			},
			description: "ﾂｰﾙ ﾎﾞｯｸｽの表示/非表示を切り替えます。",
		},
		{
			item: "ｶﾗｰ ﾎﾞｯｸｽ(&C)",
			shortcut: "Ctrl+L",
			checkbox: {
				toggle: function(){
					$colorbox.toggle();
				},
				check: function(){
					return $colorbox.is(":visible");
				},
			},
			description: "ｶﾗｰ ﾎﾞｯｸｽの表示/非表示を切り替えます。",
		},
		{
			item: "ｽﾃｰﾀｽﾊﾞｰ(&S)",
			checkbox: {
				toggle: function(){
					$status_area.toggle();
				},
				check: function(){
					return $status_area.is(":visible");
				},
			},
			description: "ｽﾃｰﾀｽﾊﾞｰの表示/非表示を切り替えます。",
		},
		{
			item: "書式ﾊﾞｰ(&E)",
			enabled: false, // @TODO
			checkbox: {},
			description: "書式ﾊﾞｰの表示/非表示を切り替えます。",
		},
		$MenuBar.DIVIDER,
		{
			item: "E&xtras Menu",
			checkbox: {
				toggle: function(){
					$extras_menu_button.toggle();
					try{
						localStorage["jspaint extras menu visible"] = this.check();
					}catch(e){}
				},
				check: function(){
					return $extras_menu_button.is(":visible");
				}
			},
			description: "拡張ﾒﾆｭｰの表示/非表示を切り替えます。",
		},
		$MenuBar.DIVIDER,
		{
			item: "拡大(&Z)",
			submenu: [
				{
					item: "標準に戻す(&N)",
					shorcut: "Ctrl+PgUp",
					description: "絵を 100% に戻します。",
					enabled: function(){
						return magnification !== 1;
					},
					action: function(){
						set_magnification(1);
					},
				},
				{
					item: "拡大する(&L)",
					shorcut: "Ctrl+PgDn",
					description: "絵を 4倍に拡大します。",
					enabled: function(){
						return magnification !== 4;
					},
					action: function(){
						set_magnification(4);
					},
				},
				{
					item: "拡大率の指定(&U)...",
					enabled: false, // @TODO
					description: "絵を拡大します。",
				},
				$MenuBar.DIVIDER,
				{
					item: "ｸﾞﾘｯﾄﾞを表示(&G)",
					shorcut: "Ctrl+G",
					enabled: false, // @TODO
					checkbox: {},
					description: "ｸﾞﾘｯﾄﾞの表示/非表示を切り替えます。",
				},
				{
					item: "実寸を表示(&H)",
					enabled: false, // @TODO
					checkbox: {},
					description: "実寸の表示/非表示を切り替えます。",
				}
			]
		},
		{
			item: "ﾋﾞｯﾄﾏｯﾌﾟ表示(&V)",
			shortcut: "Ctrl+F",
			action: view_bitmap,
			description: "絵を画面全体に表示します。",
		}
	],
	"変形(&I)": [
		{
			item: "反転と回転(&F)",
			shortcut: "Ctrl+R",
			action: image_flip_and_rotate,
			description: "絵または選択範囲を反転/回転させます。",
		},
		{
			item: "伸縮と傾き(&S)",
			shortcut: "Ctrl+W",
			action: image_stretch_and_skew,
			description: "絵または選択範囲を伸縮/傾斜させます。",
		},
		{
			item: "色の反転(&I)",
			shortcut: "Ctrl+I",
			action: image_invert,
			description: "絵または選択範囲の色を反転させます。",
		},
		{
			item: "ｷｬﾝﾊﾞｽの色とｻｲｽﾞ(&A)...",
			shortcut: "Ctrl+E",
			action: image_attributes,
			description: "ｷｬﾝﾊﾞｽの色とｻｲｽﾞを変更します。",
		},
		{
			item: "元をｸﾘｱして変形(&C)",
			shortcut: "Ctrl+Shift+N",
			//shortcut: "Ctrl+Shft+N", [sic]
			action: clear,
			description: "絵または選択範囲をｸﾘｱします。",
		}
	],
	"ｵﾌﾟｼｮﾝ(&O)": [
		{
			item: "色の設定(&E)...",
			action: function(){
				$colorbox.edit_last_color();
			},
			description: "新しい色を作成します。",
		},
		{
			item: "ﾊﾟﾚｯﾄの交換(&G)",
			action: function(){
				get_FileList_from_file_select_dialog(function(files){
					var file = files[0];
					Palette.load(file, function(err, new_palette){
						if(err){
							show_error_message("This file is not in a format that paint recognizes, or no colors were found.");
						}else{
							palette = new_palette;
							$colorbox.rebuild_palette();
						}
					});
				});
			},
			description: "以前に保存したﾊﾟﾚｯﾄを使用します。",
		},
		{
			item: "ﾊﾟﾚｯﾄの保存(&S)",
			action: function(){
				var blob = new Blob([JSON.stringify(palette)], {type: "application/json"});
				saveAs(blob, "colors.json");
			},
			description: "現在のﾊﾟﾚｯﾄをﾌｧｲﾙに保存します。",
		},
		{
			item: "縁取り(&D)",
			checkbox: {
				toggle: function(){
					transparent_opaque = {
						"opaque": "transparent",
						"transparent": "opaque",
					}[transparent_opaque];
					
					$G.trigger("option-changed");
				},
				check: function(){
					return transparent_opaque === "opaque";
				},
			},
			description: "選択範囲を縁取りまたは透かしにします。",
		}
	],
	"ﾍﾙﾌﾟ(&H)": [
		{
			item: "ﾄﾋﾟｯｸの検索(&H)",
			action: show_help,
			description: "現在のﾀｽｸやｺﾏﾝﾄﾞのﾍﾙﾌﾟを表示します。",
		},
		$MenuBar.DIVIDER,
		{
			item: "ﾊﾞｰｼﾞｮﾝ情報(&A)",
			action: function(){
				var $msgbox = new $Window();
				$msgbox.title("Paintのﾊﾞｰｼﾞｮﾝ情報");
				$msgbox.$content.html(
					"<h1><img src='images/icons/32.png'/> JS Paint<hr/></h1>" +
					"<p>JS Paint is a web-based remake of MS Paint by <a href='http://1j01.github.io/'>Isaiah Odhner</a>.</p>" +
					"<p>You can check out the project <a href='https://github.com/1j01/jspaint'>on github</a>.</p>"
				).css({padding: "15px"});
				$msgbox.center();
			},
			description: "ﾌﾟﾛｸﾞﾗﾑ情報、ﾊﾞｰｼﾞｮﾝ、著作権などを表示します。",
			//description: "Displays program information, version number, and copyright.",
		}
	],
	"拡張(&X)": [
		{
			item: "&Render History as GIF",
			// shortcut: "Ctrl+Shift+G",
			action: render_history_as_gif,
			description: "Creates an animation from the document history.",
		},
		// {
		// 	item: "Render History as &APNG",
		// 	// shortcut: "Ctrl+Shift+A",
		// 	action: render_history_as_apng,
		// 	description: "Creates an animation from the document history.",
		// },
		// {
		// 	item: "&Additional Tools",
		// 	action: function(){
		// 		// ;)
		// 	},
		// 	description: "Enables extra editing tools.",
		// },
		// {
		// 	item: "&Preferences",
		// 	action: function(){
		// 		// :)
		// 	},
		// 	description: "Configures JS Paint.",
		// }
		{
			item: "&Multiplayer",
			submenu: [
				{
					item: "&New Session From Document",
					action: function(){
						var name = prompt("Enter the session name that will be used in the URL for sharing.");
						if(typeof name == "string"){
							name = name.trim();
							if(name == ""){
								show_error_message("The session name cannot be empty.");
							}else if(name.match(/[.\/\[\]#$]/)){
								show_error_message("The session name cannot contain any of ./[]#$");
							}else{
								location.hash = "session:" + name;
							}
						}
					},
					description: "Starts a new multiplayer session from the current document.",
				},
				{
					item: "New &Blank Session",
					action: function(){
						show_error_message("Not supported yet");
					},
					enabled: false,
					description: "Starts a new multiplayer session from an empty document.",
				},
			]
		},
		{
			item: "&Themes",
			submenu: [
				{
					item: "&Classic",
					action: function(){
						set_theme("classic.css");
					},
					enabled: function(){
						return get_theme() != "classic.css"
					},
					description: "Makes JS Paint look like MS Paint from Windows 98.",
				},
				{
					item: "&Modern (WIP)",
					action: function(){
						set_theme("modern.css");
					},
					enabled: function(){
						return get_theme() != "modern.css"
					},
					description: "Makes JS Paint look a bit more modern.",
				},
			]
		},
	],
};

var go_outside_frame = false;
if(frameElement){
	try{
		if(parent.$MenuBar){
			$MenuBar = parent.$MenuBar;
			go_outside_frame = true;
		}
	}catch(e){}
}
var $menu_bar = $MenuBar(menus);
if(go_outside_frame){
	$menu_bar.insertBefore(frameElement);
}else{
	$menu_bar.prependTo($V);
}

$menu_bar.on("info", function(e, info){
	$status_text.text(info);
});
$menu_bar.on("default-info", function(e){
	$status_text.default();
});

var $extras_menu_button = $menu_bar.get(0).ownerDocument.defaultView.$(".extras-menu-button");
try{
	// TODO: refactor shared key string
	if(localStorage["jspaint extras menu visible"] != "true"){
		$extras_menu_button.hide();
	}
}catch(e){}
