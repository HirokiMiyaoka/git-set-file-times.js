// git-set-file-times for Node.js
// https://gist.github.com/mAster-rAdio/642fff6acb79b7a587fb3bce7ee1c9ef
// Perl -> TypeScript -> JavaScript

import * as path from 'path';
import * as child_process from 'child_process';
import * as readline from 'readline';
import * as fs from 'fs';

function exec( command: string, args: string[] )
{
	const proc = child_process.spawn( command, args );
	return { out: readline.createInterface( { input: proc.stdout } ), in: proc };
}

let utime = ( file: string, date: Date ) => { fs.utimesSync( file, date, date ); };

export class GitSetFileTimes
{
	private prefix: string;
	private argv: string[];
	private debug: boolean;

	constructor( option?: { dryrun?: boolean, debug?: boolean } )
	{
		if ( typeof option !== 'object' ) { option = {}; }
		this.debug = option.debug === true;
		if ( option.dryrun )
		{
			if ( this.debug )
			{
				utime = ( file: string, date: Date ) => { console.log( 'utimes:', file, date ); };
			} else
			{
				utime = ( file: string, date: Date ) => {};
			}
		} else if ( this.debug )
		{
			const _utime = utime;
			utime = ( file: string, date: Date ) =>
			{
				console.log( 'utimes:', file, date );
				_utime( file, date );
			};
		}


		this.argv = process.argv.slice( 2 );
		if ( this.argv.length <= 0 ) { return; }
		const m = this.argv[ 0 ].match( /^\-\-prefix\=(.+)$/ );
		if ( !m ) { return; }
		this.prefix = m[ 1 ] || '';
		this.argv.shift();
	}

	public start()
	{
		if ( process.env[ 'GIT_DIR' ] )
		{
			try
			{
				process.chdir( path.join( <string>process.env[ 'GIT_DIR' ], '../' ) );
			} catch( e ) { return Promise.reject( e ); }
		}

		return this.ls().then( ( list ) =>
		{
			if ( this.debug ) { console.log( list ); }
			return this.changeTime( list );
		} ).then( () => {} );
	}

	private ls(): Promise<string[]>
	{
		return new Promise( ( resolve, reject ) =>
		{
			const ls: string[] = [];
			const readline = exec( 'git', [ 'ls-files', '-z' ] ).out;
			readline.on( 'line', ( line: string ) => { ls.push( ... line.split( '\0' ).filter( ( f ) => { return !!f; } ) ); } );
			readline.on( 'close', () => { resolve( ls ); });
		} );
	}

	private changeTime( files: string[] )
	{
		return new Promise( ( resolve, reject ) =>
		{
			const readline = exec( 'git', [ 'log', '-m', '-r', '--name-only', '--no-color', '--pretty=raw', '-z', ... this.argv ] );
			let ctime: Date = new Date();
			readline.out.on( 'line', ( line: string ) =>
			{
				if ( files.length <= 0 )
				{
					readline.in.stdout.destroy();
					return;
				}
				const m = line.match( /^committer .*? (\d+) (?:[\-\+]\d+)$/ );
				if ( m )
				{
					ctime = new Date( parseInt( m[ 1 ] ) * 1000 );
					return;
				}
				const m1 = line.match( /(.+)\0\0commit [a-f0-9]{40}( \(from [a-f0-9]{40}\))?$/ );
				const m2 = line.match( /(.+)\0$/ );
				const list = ( m1 ? m1[ 1 ] : ( m2 ? m2[ 1 ] : '' ) ).split( /\0/ );
				if ( list.length <= 0 ) { return; }

				list.forEach( ( updfile ) =>
				{
					if ( !updfile ) { return; }
					const index = files.indexOf( updfile );
					if ( index < 0 ) { return; }
					utime( updfile, ctime );
					files.splice( index, 1 );
				} );
			} );

			readline.out.on( 'close', () => { resolve(); });
		} );
	}
}

if ( require.main === module ) // require.main === module or !module.parent ... client.
{
	// exec.
	const git = new GitSetFileTimes( { debug: true } );
	git.start();
}
