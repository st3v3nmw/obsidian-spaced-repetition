#course/aws/developer-associate 

In this lesson, I'm going to cover DynamoDB performance and throttling. 

# Throttling

With throttling, this will occur when the configured RCU or WCU is exceeded. And you can get this error. So it's a `ProvisionedThroughputExceededException` error. and that indicates that the request rate is too high for the read/write capacity that's provisioned for the table. 

The AWS SDKs for DynamoDB will automatically retry requests that exceed this exception. The request is eventually successful unless the retry queue is too large to finish. Let's have a look at some possible causes of performance issues. 

- Firstly we've got hot keys. That simply means that one partition key is being read too often. 
- We can also have hot partitions where our data access patterns are imbalanced. So we're trying to get a higher amount of read and writes going to one particular partition. And this comes back to how we designed our partition keys and are sort keys and our composite keys which we looked at earlier on in this section. 
- Also the items may be too large and they're consuming more RCUs and WCUs because of the size. 

So what are the potential resolutions?:
- Well, you can reduce the frequency of requests and use exponential backoff. 
- You can try and design your application for uniform activity across all logical partition keys in the table and any secondary indexes. 

# Burst Capacity

You can use [[Burst Capacity|burst capacity]] effectively. And this is because DynamoDB will retain up to five minutes, so 300 seconds of unused read and write capacity which can be consumed in a short period of time. Say, if your workload is bursty rather than consistently high, that might save you. 

You should also ensure that adaptive capacity is enabled and it is the default. This feature will minimize throttling due to throughput exceptions. Now, that's it for this lesson. Just a few tips on performance and throttling.

----

What is a benefit of using the AWS SDK when accessing DynamoDB tables configured for provisioned capacity mode::In the event of a ProvisionedThroughputExceededException, the SDK will automatically retry
<!--SR:!2024-08-01,49,250-->

Apart from price reduction, what is another benefit of minimizing data still in DynamoDB tables configured for provisioned capacity::Less data can mean less RCUs and WCUs (if it leads to a reduction in the number of blocks)
<!--SR:!2024-07-30,47,250-->

Over what duration will DynamoDB retained unused read and write capacity which can be consumed as burst capacity:: 5 minutes <!--SR:!2024-11-02,100,250-->