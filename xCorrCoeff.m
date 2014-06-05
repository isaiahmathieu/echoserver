% event is the observed sound
% match: previously recorded sound -- match candidate
% paddingZeros: size of zeros to append and prepend to event (the event of the sound heard)

function [CC] = xCorrCoef(event, match, paddingZeros)
size(event)
% 000000000 event - mean(event) 00000000
%event = [zeros(paddingZeros,1); (event(:)-mean(event(:))); zeros(paddingZeros,1)];
event = [zeros(paddingZeros,1); (event(:)-mean(event(:))); zeros(paddingZeros,1)];
length(match)
event_buf = buffer(event, length(match), length(match)-14, 'nodelay');

% normalize match
match = zscore(match);

CC = zeros(1, size(event_buf, 2));
% iterate over the subarrays of event and calculate the similarity with the match
for frame_idx = 1:size(event_buf, 2)
    %event_buf(:, frame_idx)
    %size(match)
    tmp = corrcoef( zscore(event_buf(:, frame_idx)), match);
    CC(frame_idx) = tmp(1,2);
end

CC = max(CC);
CC
