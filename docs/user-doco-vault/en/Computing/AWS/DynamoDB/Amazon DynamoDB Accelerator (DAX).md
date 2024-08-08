#course/aws/developer-associate 

DynamoDB accelerator, also known as DAX, is a way that we can reduce latency and increase performance for our DynamoDB table. DAX is a managed service that provides in-memory acceleration for our DynamoDB tables. It improves performance from milliseconds to microseconds even at really high rates like millions of requests per second. So remember those keywords millisecond and microsecond. You get millisecond latency with DynamoDB but you get microsecond latency if you put the accelerator in front of DynamoDB. It provides managed cache invalidation, data population, and cluster management. And DAX is used to improve read performance but not writes. So this is about improving reads and not writes to your database. 

You don't need to modify the application logic because DAX is compatible with DynamoDB API calls. So it's really simple to put DAX in front of your DynamoDB table. So let's look at how it looks in an architectural diagram. 

We've got DynamoDB, then we've got our application instance. And what we do is we put our cache in front of DynamoDB. Now note that the Cache is within the VPC because it runs on EC2 two instances. 

![[Pasted image 20240508132354.png]]

Now to make this work, we do need some permissions:
- The IAM role for the DAX instance must have permissions to access DynamoDB. And 
- the IAM role for the EC2 instance requires permissions to access both DynamoDB and DAX

If we have a security group we'll need these rules. So in this case we'll need inbound rules:
- So we'll need TCP 8000 and TCP 8111. 
Those are for DynamoDB and DAX. And from we can specify from the actual security group ID of the security group itself because our instance and our accelerator are both within the security group. That can be enabled really easily through the management console or using the SDK. 

And as with DynamoDB, you only pay for the capacity you actually provision. It's provisions through clusters and charged by the node. So it actually runs on EC2 instances so you pay by the node based on the instance type you use. Pricing is per node-hour consumed and is dependent on the instance type that you select. 

Now, just a quick comparison with ElastiCache another in memory caching solution. So DAX is more optimized for DynamoDB. Obviously it can call the APIs directly so it's much simpler to put in front of a DynamoDB table. With ElastiCache, you also have more management overhead for things like invalidation of items in the cache. With ElastiCache you would also need to modify the application code to point to the cache. That being said, ElastiCache does support more data stores than DAX.

----

# Questions

Does DynamoDB DAX improve latency for both read and write operations::No - just reads
<!--SR:!2024-06-20,27,250-->

What is DynamoDB DAX::a managed service that provides in-memory acceleration for our DynamoDB tables
<!--SR:!2024-08-05,51,250-->

How much of an improvement does DAX provide on read operations::From milliseconds to microseconds
<!--SR:!2024-10-21,90,248-->

On what compute platform does DynamoDB DAX run::EC2
<!--SR:!2024-08-06,52,250-->

What security mechanisms are required for using DAX
?
(1) The IAM role for the DAX instance must have permissions to access DynamoDB.
(2) the IAM role for the EC2 instance requires permissions to access both DynamoDB and DAX
(3) the security group needs to allow TCP 8000 and TCP 8111. <!--SR:!2024-08-13,19,190-->

Why is it easier to use DAX for speeding up access to DynamoDB rather than Elasticache::DAX accepts the same api as DynamoDB itself, therefore no code change required
<!--SR:!2024-07-29,34,250-->



