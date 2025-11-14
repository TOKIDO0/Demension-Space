package com.example.entity;

import lombok.Data;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import com.baomidou.mybatisplus.annotation.TableId;


@Data
@TableName("materialpurchase")
public class Materialpurchase extends Model<Materialpurchase> {
    /**
      * 主键
      */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
      * 材料价格 
      */
    private Integer money;

    /**
      * 材料名称 
      */
    private String name;

    /**
      * 项目id 
      */
    private Integer projectid;

    /**
      * 供应商id 
      */
    private Integer supplierid;

}