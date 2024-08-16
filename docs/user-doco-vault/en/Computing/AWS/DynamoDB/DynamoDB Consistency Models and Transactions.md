#course/aws/developer-associate 

In this lesson, I'm going to cover [[DynamoDB Consistency Models|DynamoDB consistency models]] and transactions. 

# Consistency Models

DynamoDB supports eventually consistent as well as strongly consistent reads. 

Now, [[Eventually Consistent Read|eventually consistent reads]] means that when you read data from a table, the response might not reflect the results of a recently completed write operation. The response might include some stale data. And if you repeat your read request after a short time, the response should return the latest data. 

We then have the [[Strongly Consistent Read|strongly consistent read]]. In this case, a response is returned with the most up to date data reflecting the updates from all prior write operations that were successful. 

A strongly consistent read may not be available if there is a network delay or outage. In that case you might get a server error with an HTTP 500 code. 

Strongly consistent reads also have higher latency than eventually consistent reads. Strongly consistent reads are not supported on [[Global Secondary Index (GSI)|global secondary indexes]] and they use more throughput capacity than eventually consistent reads and we'll be able to calculate that soon. 

So let's look at a diagram to visualize what I'm talking about. Here we have an application, our DynamoDB table, and the actual backend of the table is spread across three availability zones within a region. 

![[Pasted image 20240504223518.png]]

So the application puts an item into the table. That item is then written into the table and it's going to get replicated. Now let's say you immediately perform a get item straight after the put item. And in this case DynamoDB has sent the read request to a partition over in table A here or a partition that doesn't have the replicated data in it at this point because we can see the full sync has not happened. Now in this case, it's an eventually consistent read. So we actually get a failure. 

Now a short while later the replication continues. That's all complete. And if we try and read again then we get a success. With a strongly consistent read, data will always be returned when reading after a successful write and eventually consistent reads are the default. 

Now, how do you configure strongly consistent reads? Well, you can do so with the API when you issue get item query and scan APIs. And you need to set the consistent read to true. 

# Transactions

Next we have something called [[DynamoDB Transactions|DynamoDB transactions]]. In this case, the table will make coordinated all or nothing changes to multiple items within and across tables. 

Transactions provide ACID compliance. So that's atomicity, consistency, isolation, and durability. 

It enables reading and writing of multiple items across multiple tables as an all or nothing operation. So in other words it either succeeds everywhere or nowhere. 

DynamoDB checks for a prerequisite condition before writing to the table. With the transaction write API, you can group multiple Put, Update, Delete, and ConditionCheck actions. And you can submit them as a single TransactWriteItems operation that either succeeds or it fails. The same is true for multiple Get actions which you can group and submit as a single TransactGetItems operation. There's no additional cost to enable transactions for DynamoDB tables and you only pay for the reads or writes that are part of your transaction. 

DynamoDB performs two underlying reads or writes of every item in the transaction. That's one to prepare the transaction and then one to commit the transaction. 

So let's see it in action. We have an Amazon EC2 instance here. And we have two different tables across two different accounts account A and account B. Now we used to transact write items API to try and write to both tables simultaneously. Now the write in account A fails. That means the write in account B will fail as well because it's an all or nothing transaction. In another case, we rerun the TransactWriteItems and in this case it succeeds in both locations. So because it succeeds in both locations, all is good. If one fails, both fails, so remember that. Everything has to succeed all or nothing. And that's it for this lesson.

----
# Questions

What are the two consistency models supported by DynamoDB::Eventually consistent read, strongly consistent read
<!--SR:!2024-08-01,39,250-->

Are strongly consistent reads supported for reads involving (1) local secondary indexes (2) global secondary indexes (3) neither (4) both:: local secondary indexes only
<!--SR:!2024-07-28,31,230-->

With DynamoDB where is the consistency model specified::for individual query and scan operations
<!--SR:!2024-07-05,17,230-->

What does the acronym ACID mean::atomicity, consistency, isolation, and durability
<!--SR:!2024-08-01,47,250-->

What types of APIs can be grouped together within a single DynamoDB transaction:: (1) multiple Put, Update, Delete, and ConditionCheck actions (2) multiple get actions.
<!--SR:!2024-08-16,24,210-->