export declare class GitSetFileTimes {
    private prefix;
    private argv;
    private debug;
    constructor(option?: {
        dryrun?: boolean;
        debug?: boolean;
    });
    start(): Promise<void>;
    private ls();
    private changeTime(files);
}
