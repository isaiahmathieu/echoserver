% takes the path of an audio file (an event uploaded from the device)
% and returns the (string) name of a matching sample if it thinks it's
% a match, otherwise returns the string NO_MATCH
function matchSounds(eventFilePath, matchSoundsFolder, resultsFileName)
disp('event file path:');
disp(eventFilePath);
disp('results file path:');
disp(resultsFileName);
ccThreshold = .2;
% get all the .wav files, which is just a way to exclude . and ..
matchSounds = dir(strcat(matchSoundsFolder, '*.wav'));
% create the file to put the results in. first delete it in case there it contains something that could confuse us
delete(resultsFileName);
fileID = fopen(resultsFileName, 'w');
% get the data of the event file
[eventData, eventFs] = wavread(eventFilePath);
eventFs
size(eventData)
maxCC = 0;
bestMatch = '';

% iterate over all the matches
for i = 1:length(matchSounds)
    matchFile = getfield(matchSounds(i), 'name');
    matchSounds(i)
    try
    [matchData, matchFs] = wavread(strcat(matchSoundsFolder,matchFile));
    CC = xCorrCoef(eventData, matchData,length(eventData));
    tmp = max(CC)
    if tmp > maxCC
        maxCC = tmp;
        bestMatch = matchFile;
    end
    catch err
		display(strcat('error processing file: ', matchFile));
		display(err);
    end
end

if maxCC > ccThreshold
	fprintf(fileID,'%s',bestMatch);
	%fprintf(fileID,'%f\n',maxCC);
    disp(bestMatch);
    disp(maxCC);
else
	fprintf(fileID,'NO_MATCH');
    disp('NO_MATCH');
end
