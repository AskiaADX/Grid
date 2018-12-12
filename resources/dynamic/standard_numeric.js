/* standard_numeric.js */
{% 
Dim i
Dim arr = CurrentQuestion.ParentLoop.ParentLoop.AvailableAnswers
Dim ar = CurrentQuestion.ParentLoop.AvailableAnswers
Dim inputName
For i = 1 To arr.Count
	inputName = CurrentQuestion.Iteration(ar[1].Index,arr[i].Index).InputName()
	%}
	{element : $('#{%= inputName%}')},
	{%
	inputName = CurrentQuestion.Iteration(ar[2].Index,arr[i].Index).InputName()
	%}
	{element : $('#{%= inputName%}')}{%= On(i < arr.Count, ",", "") %}
{% Next %}