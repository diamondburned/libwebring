{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
	buildInputs = with pkgs; [
		deno
		esbuild
		dart-sass
		nodePackages.prettier
	];
}
