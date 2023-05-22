{ pkgs ? import <nixpkgs> {} }:

let
	super = pkgs;
in

let
	google-chrome-headless =
		let
			google-chrome = pkgs.google-chrome.override {
				icu = null;
				gtk4 = null;
				gtk3 = null;
				speechd = null;
				pipewire = null;
				at-spi2-atk = null;
				at-spi2-core = pkgs.hello;
				util-linux = null;
				xdg-utils = null;
				harfbuzz = null;
				gdk-pixbuf = null;
				pulseSupport = false;
				libvaSupport = false;
			};
		in
			pkgs.writeShellScriptBin "google-chrome-headless" ''
				unset DISPLAY
				exec ${google-chrome}/bin/google-chrome-stable --headless --disable-gpu --disable-software-rasterizer "$@"
			'';
in

pkgs.mkShell {
	buildInputs = with pkgs; 
		([ deno google-chrome-headless ]);
}
