{ pkgs ? import <nixpkgs> {} }:

let
	nix-dart-sass =
		let
		 	src = pkgs.fetchFromGitHub {
				owner = "polyfooly";
				repo = "nix-dart-sass";
				rev = "e758ad15a4875fa7661f94f28f01a1b7cf579b84";
				sha256 = "03kmz5r4jv0j8x9asz4y19xm1chwgbsizf9cyadjqsnvgv5rb4i6";
			};
		in
			import src {
				inherit pkgs;
				sha256 = "0vdqcqkdbk1n71lbjkmravpw43h8lxc8dgk6sanlscnm98nlgc01";
				version = "1.62.1";
			};

in
	pkgs.mkShell {
		buildInputs = with pkgs; [
			deno
			esbuild
			nix-dart-sass
			nodePackages.prettier
		];
	}
