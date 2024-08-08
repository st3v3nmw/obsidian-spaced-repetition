#course/aws/developer-associate 

When searching for data in our DynamoDB tables we can use the scan API and the query API. And these come up in exam questions where you need to know the benefits and drawbacks of each and when to use them. So let's start with the scan API. 

# Scan

The [[scan|scan]] operation returns one or more items and attributes by accessing every item in a table or a secondary index. 

To have DynamoDB return fewer items, you can provide a filter expression operation. Now note that accessing every item in a table or secondary index does incur costs because we're actually reading those items. A single scan operation reads up to the maximum number of items set if you use the limit parameter or a maximum of one megabyte. 

Scan APIs can use a lot of RCUs as they access every single item in your table. Scan operations proceed sequentially. 

Applications can request parallel scans using the segment and total segments parameters. The scan uses eventually consistent reads when accessing the data in a table. If you need a consistent copy of the data as of the time the scam begins you can set the consistent read parameter to true. 

So let's see what happens with a scan. In this case, the developer has sent a scan API request. And in this case there's only a few items in our table but all of them are actually accessed. Of course in a big table that's going to be a lot of RCUs. And then the results are returned. Now in this case, all items and all attributes are returned. 

![[Pasted image 20240506155555.png]]

You can use a scan with a [[Projection Expression|projection expression]]. In this example, the scan returns all posts in the forum that were posted within a date range and they have more than 50 replies. So this is the scan. You can see here, we're doing this through the console. We're choosing a scan, sorting by post ID, filtering by replies and last post time. And we've got a date range here and a max number of replies. So let's see what a scan API with a projection expression looks like. So we issue the scan API with our projection expression. 

In this case, all of the items in the table are accessed using lots of RCUs. But in the results, select attributes are returned. 

# Query

Next we have the query API. A [[query|query]] operation finds items in your table based on the primary key attribute and a distinct value to search for. 
 
So for example, you might search for the user ID and then all attributes related to that item would be returned. You can optionally use a sort key name and value to refine the results. 

So for example, if you're sort key is a timestamp, you can refine the query to only select items with a timestamp within the last seven days. All attributes are returned for the items by default. You can also use the projection expression parameter as we did with the scan API to just return the select attributes we need. 

By default, queries are eventually consistent. To use strongly consistent you need to explicitly set this in the query. 

So let's look at using a query API. A developer uses a query API request with a projection expression. Now in this case, select items with select attributes to access, consuming far fewer RCUs. And then those results are returned. In another example, the query returns only items with the client ID of chris@example.com that were created within a certain date range and that are in the category of pen. So here we can see how we're creating the query through the console. We've chosen the product orders table with client ID and created, we've specified as the string here chrisexample.com and then between a specific date range. We've also specified a filter for the category which is a string and it's equal to pen. So that's it for this lesson. Make sure you fully understand the differences between the scan and the query API before you sit the exam.

----

# Questions

When performing a DynamoDB scan operation, what limits are there on the amount of returned data::(1) the item limit specified in the scan request (2) 1 megabyte
<!--SR:!2024-07-10,15,230-->

What is the benefit of using a projection expression in a DynamoDB scan request given that it still reads all attributes and therefore no reduction in RCUs
?
It only returns the requested attributes, meaning less data transfer, less data to process by the client.
<!--SR:!2024-07-18,34,250-->

What is the disadvantage of the DynamoDB query operation compared with scan::It can only retrieve items with the specified partition key
<!--SR:!2024-09-04,43,250-->

How does DynamoDB scan and query compare regarding the projection expression::Both only return the requested attributes, but scan still reads all, whilst query only reads those requested.
<!--SR:!2024-08-20,63,250-->

